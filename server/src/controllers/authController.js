// src/controllers/authController.js
const prisma = require("../lib/prisma");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { hashPassword, comparePassword } = require("../utils/hash");
const { sendVerifyEmail, sendResetEmail } = require("../lib/emails");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../lib/resend");
const { validateEmail } = require("../utils/emailValidator");

// Google Sign-In
const { OAuth2Client } = require("google-auth-library");
// Nëse nuk ka GOOGLE_CLIENT_ID, paralajmëro (nuk e ndalim serverin që të mund të zhvillosh pa Google)
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn("⚠️  GOOGLE_CLIENT_ID mungon në .env. /api/auth/google do kthejë 500 derisa ta shtosh.");
}
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

// Kontroll për JWT_SECRET (pa këtë s’ka sens të vazhdojmë)
if (!process.env.JWT_SECRET) {
  console.error("❗ JWT_SECRET mungon në .env. Serveri nuk mund të vazhdojë pa të.");
  process.exit(1);
}

/* ===================== Helpers ===================== */
// Removed isGmail function - no longer restricting to Gmail only
const createTokenRaw = (len = 32) => crypto.randomBytes(len).toString("hex");
const hashToken = (token) => crypto.createHash("sha256").update(String(token || "")).digest("hex");

// Lock in-memory kundër dërgimeve të dyfishta brenda të njëjtit proces
const inFlightVerifySend = new Set();

/* ===================== REGISTER ===================== */
const register = async (req, res) => {
  const { name, email, password } = req.body;
  // console.log("➡️  [REGISTER] payload:", { email });

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Të gjitha fushat janë të detyrueshme." });
    }
    
    // Validimi i email-it (çdo provider)
    const emailValidation = await validateEmail(email);
    if (!emailValidation.isValid) {
      // console.log("❌ [REGISTER] Email validation failed:", emailValidation.error);
      return res.status(400).json({ message: emailValidation.error });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: "Ky email është tashmë i regjistruar." });
    }

    const passwordHash = await hashPassword(password);
    const createdUser = await prisma.user.create({
      data: { name, email, password: passwordHash },
      select: { id: true, name: true, email: true },
    });
    // console.log("✅ [REGISTER] user u krijua:", createdUser.id);

    // 0) Nëse ka token ende të vlefshëm → SKIP
    const pre = await prisma.emailVerificationToken.findUnique({
      where: { userId: createdUser.id },
    });
    if (pre && pre.expiresAt > new Date()) {
      console.log("⏱️  [REGISTER] Token ekzistues ende i vlefshëm; skip send.");
      return res.status(201).json({
        message: "Regjistrimi u krye. Kontrollo email-in për linkun e verifikimit (vlen 24 orë).",
      });
    }

    // 1) Gjenero token të ri
    const raw = createTokenRaw(32);
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 2) Nëse kishte rresht (i skaduar) → fshije përpara CREATE
    if (pre) {
      await prisma.emailVerificationToken
        .delete({ where: { userId: createdUser.id } })
        .catch(() => {});
    }

    // 3) PROVO CREATE – vetëm fituesi dërgon email
    let created = false;
    try {
      await prisma.emailVerificationToken.create({
        data: { tokenHash, expiresAt, user: { connect: { id: createdUser.id } } },
      });
      created = true;
      console.log("✅ [REGISTER] token verifikimi u KRIJUA për:", createdUser.id);
    } catch (e) {
      if (e?.code === "P2002") {
        console.log("🪢 [REGISTER] Race P2002 – një proces tjetër e krijoi. Skip dërgimin.");
        return res.status(201).json({
          message: "Regjistrimi u krye. Kontrollo email-in për linkun e verifikimit (vlen 24 orë).",
        });
      }
      throw e;
    }

    if (created) {
      if (inFlightVerifySend.has(createdUser.id)) {
        console.log("🔁 [REGISTER] Send në progres; skip.");
      } else {
        inFlightVerifySend.add(createdUser.id);
        try {
          await sendVerificationEmail({ to: createdUser.email, name: createdUser.name, token: raw });
          console.log("📬 [REGISTER] Verifikimi u dërgua →", createdUser.email);
        } catch (emailError) {
          console.log("⚠️ [REGISTER] Email verifikimi dështoi, por regjistrimi u krye:", emailError.message);
        } finally {
          inFlightVerifySend.delete(createdUser.id);
        }
      }
    }

    return res.status(201).json({
      message: "Regjistrimi u krye me sukses! Mund të bësh login tani.",
      user: { id: createdUser.id, name: createdUser.name, email: createdUser.email }
    });
  } catch (error) {
    console.error("🛑 [REGISTER] Gabim:", error?.stack || error);
    return res.status(500).json({ error: "Regjistrimi dështoi", details: error.message });
  }
};

/* ===================== LOGIN ===================== */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email dhe fjalëkalimi janë të detyrueshëm." });
    }
    
    // Validimi i email-it (çdo provider)
    const emailValidation = await validateEmail(email);
    if (!emailValidation.isValid) {
      console.log("❌ [LOGIN] Email validation failed:", emailValidation.error);
      return res.status(400).json({ message: emailValidation.error });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Email ose fjalëkalim i pasaktë." });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Email ose fjalëkalim i pasaktë." });

    // Lejo login pa email verifikimi për test
    // if (!user.emailVerifiedAt) {
    //   return res.status(403).json({ message: "Verifiko email-in përpara se të hysh." });
    // }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Identifikimi me sukses.",
      token,
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    console.error("🛑 [LOGIN] Gabim:", error?.stack || error);
    return res.status(500).json({ error: "Identifikimi dështoi", details: error.message });
  }
};

/* ===================== FORGOT PASSWORD ===================== */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log("➡️  [FORGOT] kërkesë nga:", email);

  try {
    if (!email) return res.status(400).json({ message: "Email është i detyrueshëm." });
    
    // Validimi i email-it (çdo provider)
    const emailValidation = await validateEmail(email);
    if (!emailValidation.isValid) {
      console.log("❌ [FORGOT] Email validation failed:", emailValidation.error);
      return res.status(400).json({ message: emailValidation.error });
    }

    // Uniform response
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.emailVerifiedAt) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const raw = createTokenRaw(32);
      const tokenHash = hashToken(raw);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { tokenHash, expiresAt, user: { connect: { id: user.id } } },
      });

      try {
        await sendResetPasswordEmail({ to: user.email, token: raw });
        console.log("✅ [FORGOT] Email reset u dërgua:", email);
      } catch (emailErr) {
        console.error("❌ [FORGOT] sendResetEmail:", emailErr?.stack || emailErr);
      }
    }

    return res
      .status(200)
      .json({ message: "Nëse email ekziston, është dërguar udhëzimi për rivendosje." });
  } catch (error) {
    console.error("🛑 [FORGOT] Gabim:", error?.stack || error);
    return res.status(500).json({ error: "Kërkesa për rivendosje dështoi", details: error.message });
  }
};

/* ===================== RESET PASSWORD ===================== */
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: "Token dhe fjalëkalimi janë të detyrueshëm." });
  }

  try {
    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token i pavlefshëm ose ka skaduar." });
    }

    const hashed = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.delete({ where: { id: record.id } }),
    ]);

    return res.status(200).json({ message: "Fjalëkalimi u rivendos me sukses." });
  } catch (error) {
    console.error("🛑 [RESET] Gabim:", error?.stack || error);
    return res.status(500).json({ error: "Rivendosja dështoi", details: error.message });
  }
};

/* ===================== VERIFY EMAIL ===================== */
const verifyEmail = async (req, res) => {
  const raw = String(req.query.token || "");
  if (!raw) return res.status(400).send("Missing token");

  try {
    const tokenHash = hashToken(raw);
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.expiresAt < new Date()) {
      const url = `${process.env.BASE_URL}/login?verified=0`;
      return res.redirect(url);
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);
    console.log("✅ [VERIFY] user u verifikua:", record.userId);

    const url = `${process.env.BASE_URL}/login?verified=1`;
    return res.redirect(url);
  } catch (error) {
    console.error("🛑 [VERIFY] Gabim:", error?.stack || error);
    const url = `${process.env.BASE_URL}/login?verified=0`;
    return res.redirect(url);
  }
};

/* ===================== RESEND VERIFICATION ===================== */
const resendVerification = async (req, res) => {
  const { email } = req.body || {};
  console.log("➡️  [RESEND] payload:", { email });

  // Uniform response për input të paplotë
  if (!email) {
    return res.status(200).json({ message: "Nëse email ekziston, do të dërgohet verifikimi." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: "Nëse email ekziston, do të dërgohet verifikimi." });
    }
    if (user.emailVerifiedAt) {
      return res.status(200).json({ message: "Email tashmë i verifikuar." });
    }

    // Nëse ka token ende të vlefshëm → SKIP
    const cur = await prisma.emailVerificationToken.findUnique({ where: { userId: user.id } });
    if (cur && cur.expiresAt > new Date()) {
      return res
        .status(200)
        .json({ message: "Linku ekzistues është ende i vlefshëm. Kontrollo inbox/Spam." });
    }

    // Nëse ka rresht (i skaduar) → fshije përpara CREATE
    if (cur) {
      await prisma.emailVerificationToken.delete({ where: { userId: user.id } }).catch(() => {});
    }

    // CREATE – vetëm fituesi dërgon
    const raw = createTokenRaw(32);
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let created = false;
    try {
      await prisma.emailVerificationToken.create({
        data: { tokenHash, expiresAt, user: { connect: { id: user.id } } },
      });
      created = true;
      console.log("✅ [RESEND] token verifikimi u KRIJUA për:", user.id);
    } catch (e) {
      if (e?.code === "P2002") {
        console.log("🪢 [RESEND] Race P2002 – dikush tjetër e krijoi. Skip dërgimin.");
        return res.status(200).json({ message: "Nëse email ekziston, u dërgua një link i ri verifikimi." });
      }
      throw e;
    }

    if (created) {
      if (inFlightVerifySend.has(user.id)) {
        console.log("🔁 [RESEND] Send në progres; skip.");
      } else {
        inFlightVerifySend.add(user.id);
        try {
          await sendVerificationEmail({ to: user.email, name: user.name, token: raw });
          console.log("📬 [RESEND] verifikimi u ridërgua te:", user.email);
        } finally {
          inFlightVerifySend.delete(user.id);
        }
      }
    }

    return res.status(200).json({ message: "Nëse email ekziston, u dërgua një link i ri verifikimi." });
  } catch (err) {
    console.error("🛑 [RESEND] Gabim:", err?.stack || err);
    return res.status(200).json({ message: "Nëse email ekziston, u dërgua një link i ri verifikimi." });
  }
};

/* ===================== Sign in / Sign up with Google ===================== */
const googleSignIn = async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID mungon në konfigurim." });
    }

    const { credential } = req.body; // ID token nga FE
    if (!credential) return res.status(400).json({ message: "Missing credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = (payload?.email || "").toLowerCase();
    const emailVerified = !!payload?.email_verified;

    if (!emailVerified) return res.status(400).json({ message: "Google email nuk është verifikuar." });
    // Lejo çdo email provider të vlefshëm

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPwd = crypto.randomBytes(16).toString("hex");
      user = await prisma.user.create({
        data: {
          name: payload?.name || email.split("@")[0],
          email,
          password: await hashPassword(randomPwd),
          emailVerifiedAt: new Date(), // ✅ email i verifikuar nga Google
          // (opsionale) googleSub: payload?.sub, // shto fushë në skemë nëse të duhet
        },
      });
    } else if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login me Google i suksesshëm",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error("🛑 [GOOGLE] Gabim:", e?.stack || e);
    return res.status(401).json({ message: "Verifikimi i Google dështoi." });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleSignIn,
};
