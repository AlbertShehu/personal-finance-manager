// src/controllers/authController.js
const prisma = require("../lib/prisma");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { hashPassword, comparePassword } = require("../utils/hash");
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

    // 1) Gjenero token të ri
    const raw = createTokenRaw(32);
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔑 [REGISTER] Token created:");
      console.log("   - Raw token: %s (length=%d)", raw, raw.length);
      console.log("   - Hash token: %s", tokenHash);
    } else {
      console.log("🔑 [REGISTER] Token created (length=%d, hash=%s...)", raw.length, tokenHash.substring(0, 20));
    }

    // 2) Upsert token - shmang race conditions
    await prisma.emailVerificationToken.upsert({
      where: { userId: createdUser.id },
      update: { tokenHash, expiresAt, usedAt: null }, // 🔹 reset usedAt për token të ri
      create: { userId: createdUser.id, tokenHash, expiresAt },
    });
    
    console.log("✅ [REGISTER] token verifikimi u UPSERT për:", createdUser.id);

    // Fire-and-forget: dërgo emailin në sfond pa pritur
    if (inFlightVerifySend.has(createdUser.id)) {
      console.log("🔁 [REGISTER] Send në progres; skip.");
    } else {
      inFlightVerifySend.add(createdUser.id);
      // NUK përdorim 'await' - kthe përgjigje menjëherë
      sendVerificationEmail({ to: createdUser.email, name: createdUser.name, token: raw, language: req.body.language || 'sq' })
        .then(() => {
          console.log("📬 [REGISTER] Verifikimi u dërgua →", createdUser.email);
        })
        .catch((emailError) => {
          console.error("⚠️ [REGISTER] Email verifikimi dështoi:", emailError.message);
        })
        .finally(() => {
          inFlightVerifySend.delete(createdUser.id);
        });
    }

    // Kthe përgjigje MENJËHERË - s'ka timeout
    return res.status(201).json({
      message: "Regjistrimi u krye. Kontrollo email-in për linkun e verifikimit (vlen 24 orë).",
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

    // Kërko email verification për production
    if (!user.emailVerifiedAt) {
      return res.status(403).json({ message: "Verifiko email-in përpara se të hysh." });
    }

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

      // Fire-and-forget: dërgo emailin në sfond pa pritur
      sendResetPasswordEmail({ to: user.email, token: raw, language: req.body.language || 'sq' })
        .then(() => {
          console.log("✅ [FORGOT] Email reset u dërgua:", email);
        })
        .catch((emailErr) => {
          console.error("❌ [FORGOT] sendResetEmail:", emailErr?.stack || emailErr);
        });
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
  // 1) Pastro token-in nga query
  const raw = (req.query.token ?? '')
    .toString()
    .trim()
    .replace(/\s/g, ''); // heq \r, \n, space

  if (process.env.NODE_ENV !== 'production') {
    console.log("🔍 [VERIFY] raw=%s (len=%d)", raw, raw.length);
  } else {
    console.log("🔍 [VERIFY] Token received (len=%d)", raw.length);
  }
  
  if (!raw) {
    console.error("❌ [VERIFY] Token mungon");
    return res.status(400).json({ message: "Token mungon" });
  }

  try {
    // 2) Llogarit hash-in
    const hashed = hashToken(raw);
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔍 [VERIFY] hashed=%s", hashed);
    }

    // 3) Provo token aktiv (jo i përdorur, jo i skaduar)
    let record = await prisma.emailVerificationToken.findFirst({
      where: { 
        tokenHash: { in: [hashed, raw] }, 
        expiresAt: { gt: new Date() }, 
        usedAt: null 
      },
    });

    console.log("🔍 [VERIFY] Active record found:", record ? "YES" : "NO");

    if (record) {
      // 4) Konfirmo email-in dhe shëno token-in si i përdorur
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { emailVerifiedAt: new Date() },
        }),
        prisma.emailVerificationToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() }, // 🔹 shëno si i përdorur
        }),
      ]);
      
      const user = await prisma.user.findUnique({ where: { id: record.userId } });
      console.log("✅ [VERIFY] Email verified for user:", user.email);

      // 5) Ridrejto te front-i
      const url = `${process.env.BASE_URL}/login?verified=1`;
      return res.redirect(url);
    }

    // 6) Nëse nuk është aktiv, kontrollo nëse është përdorur më parë
    const used = await prisma.emailVerificationToken.findFirst({
      where: { 
        tokenHash: { in: [hashed, raw] }, 
        usedAt: { not: null } 
      },
    });

    if (used) {
      // Idempotent/safe-links: trajto si sukses
      console.log("✅ [VERIFY] Token already used - treating as success (idempotent)");
      const url = `${process.env.BASE_URL}/login?verified=1`;
      return res.redirect(url);
    }

    // 7) Përndryshe, vërtet invalid/skaduar
    console.error("❌ [VERIFY] Token i pavlefshëm - s'u gjet në databazë");
    return res.status(400).json({ message: "Token i verifikimit është i pavlefshëm ose ka skaduar" });

  } catch (error) {
    console.error("🛑 [VERIFY] Gabim:", error?.stack || error);
    return res.status(500).json({ message: "Verifikimi dështoi", error: error.message });
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

    // 1) Gjenero token të ri
    const raw = createTokenRaw(32);
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔑 [RESEND] Token created:");
      console.log("   - Raw token: %s (length=%d)", raw, raw.length);
      console.log("   - Hash token: %s", tokenHash);
    } else {
      console.log("🔑 [RESEND] Token created (length=%d, hash=%s...)", raw.length, tokenHash.substring(0, 20));
    }

    // 2) Upsert token - shmang race conditions
    await prisma.emailVerificationToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt, usedAt: null }, // 🔹 reset usedAt për token të ri
      create: { userId: user.id, tokenHash, expiresAt },
    });
    
    console.log("✅ [RESEND] token verifikimi u UPSERT për:", user.id);

    // Fire-and-forget: dërgo emailin në sfond pa pritur
    if (inFlightVerifySend.has(user.id)) {
      console.log("🔁 [RESEND] Send në progres; skip.");
    } else {
      inFlightVerifySend.add(user.id);
      // NUK përdorim 'await' - kthe përgjigje menjëherë
      sendVerificationEmail({ to: user.email, name: user.name, token: raw, language: req.body.language || 'sq' })
        .then(() => {
          console.log("📬 [RESEND] verifikimi u ridërgua te:", user.email);
        })
        .catch((emailError) => {
          console.error("⚠️ [RESEND] Email dështoi:", emailError.message);
        })
        .finally(() => {
          inFlightVerifySend.delete(user.id);
        });
    }

    // Kthe përgjigje MENJËHERË - s'ka timeout
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

    const { idToken } = req.body; // ID token nga FE
    if (!idToken) return res.status(400).json({ message: "Missing credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
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
          googleId: payload?.sub, // Ruaj Google ID
          profilePicture: payload?.picture, // Ruaj foton e profilit
        },
      });
    } else if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          emailVerifiedAt: new Date(),
          googleId: payload?.sub, // Përditëso Google ID nëse mungon
          profilePicture: payload?.picture, // Përditëso foton e profilit
        },
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
