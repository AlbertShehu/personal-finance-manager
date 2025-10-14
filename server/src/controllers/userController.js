// server/controllers/userController.js
const prisma = require("../lib/prisma");
const { hashPassword, comparePassword } = require("../utils/hash");
const { sendVerificationEmail } = require("../lib/resend");
const crypto = require("crypto");

// helpers
const isGmail = (email) => /@(gmail|googlemail)\.com$/i.test(email);
const createTokenRaw = (len = 32) => crypto.randomBytes(len).toString("hex");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

/**
 * 📄 GET /api/users/profile
 * Kthen profilin e përdoruesit të autentikuar
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Përdoruesi nuk u gjet." });
    }

    return res.json(user);
  } catch (error) {
    console.error("🛑 [PROFILE] Gabim:", error);
    return res
      .status(500)
      .json({ message: "Gabim i brendshëm serveri", details: error.message });
  }
};

/**
 * 🔒 PATCH /api/users/change-password
 * Kërkon: { currentPassword, newPassword }
 */
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Të dy fjalëkalimet janë të detyrueshme." });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Fjalëkalimi i ri duhet të ketë të paktën 8 karaktere." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: "Përdoruesi nuk u gjet." });
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Fjalëkalimi aktual është i gabuar." });
    }

    // mos lejo të njëjtin fjalëkalim
    const sameAsOld = await comparePassword(newPassword, user.password);
    if (sameAsOld) {
      return res
        .status(400)
        .json({ message: "Fjalëkalimi i ri duhet të jetë ndryshe nga ai aktual." });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return res.json({ message: "Fjalëkalimi u ndryshua me sukses." });
  } catch (error) {
    console.error("🛑 [CHANGE-PASSWORD] Gabim:", error);
    return res
      .status(500)
      .json({ message: "Gabim gjatë ndryshimit të fjalëkalimit", details: error.message });
  }
};

/**
 * ✏️ PATCH /api/users/profile
 * Kërkon: { name, email }
 * - Lejon vetëm Gmail si email
 * - Nëse email-i ndryshon: e bën jo të verifikuar dhe dërgon link verifikimi në adresën e re
 */
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ message: "Emri dhe emaili janë të detyrueshëm." });
  }

  if (!isGmail(email)) {
    return res.status(400).json({ message: "Lejohen vetëm adresat Gmail." });
  }

  try {
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) {
      return res.status(404).json({ message: "Përdoruesi nuk u gjet." });
    }

    const emailChanged =
      email.toLowerCase() !== current.email.toLowerCase();

    // nëse email-i ndryshon, kontrollo unikueshmërinë paraprakisht
    if (emailChanged) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists && exists.id !== userId) {
        return res.status(409).json({ message: "Ky email është tashmë i përdorur." });
      }
    }

    // bëj update-in bazik
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        ...(emailChanged ? { emailVerifiedAt: null } : {}), // re-verifikim nëse ndryshon email
      },
      select: { id: true, name: true, email: true, emailVerifiedAt: true, createdAt: true },
    });

    // nëse email-i ndryshoi → gjenero token verifikimi dhe dërgo email
    if (emailChanged) {
      await prisma.emailVerificationToken.deleteMany({ where: { userId } });

      const raw = createTokenRaw(32);
      const tokenHash = hashToken(raw);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await prisma.emailVerificationToken.create({
        data: { tokenHash, expiresAt, user: { connect: { id: userId } } },
      });

      try {
        await sendVerificationEmail({ to: updated.email, name: updated.name, token: raw });
        console.log("📬 [PROFILE] Verifikim i dërguar te adresa e re:", updated.email);
      } catch (e) {
        console.error("❌ [PROFILE] Dërgimi i verifikimit dështoi:", e?.message || e);
        // opcionale: mund të kthesh 202 Accepted me paralajmërim
      }
    }

    return res.json({
      message: emailChanged
        ? "Profili u përditësua. Dërguam email verifikimi në adresën e re."
        : "Profili u përditësua me sukses.",
      user: updated,
    });
  } catch (error) {
    console.error("🛑 [UPDATE-PROFILE] Gabim:", error);
    return res
      .status(500)
      .json({ message: "Gabim gjatë përditësimit të profilit", details: error.message });
  }
};

/**
 * 🗑️ DELETE /api/users/me
 * Kërkon: { password } në body; kërkon JWT në header (requireAuth)
 * Fshin: transaksionet, token-at, dhe më pas user-in (hard delete) brenda një tranzaksioni.
 */
const deleteAccount = async (req, res) => {
  try {
    console.log("🗑️ [DELETE ACCOUNT] Request received:", {
      userId: req.user?.id,
      hasPassword: !!req.body?.password,
      body: req.body
    });

    const userId = req.user?.id;
    const { password } = req.body || {};

    if (!userId) return res.status(401).json({ message: "Nuk je autentikuar." });
    if (!password) return res.status(400).json({ message: "Fjalëkalimi është i detyrueshëm." });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "Përdoruesi nuk u gjet." });

    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ message: "Fjalëkalim i pasaktë." });

    console.log("🗑️ [DELETE ACCOUNT] Starting deletion for user:", userId);

    const result = await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    console.log("✅ [DELETE ACCOUNT] Successfully deleted user:", userId, "Result:", result);

    return res.status(200).json({ message: "Llogaria u fshi me sukses." });
  } catch (err) {
    console.error("🛑 [DELETE ACCOUNT] Gabim:", err?.stack || err);
    return res.status(500).json({ message: "Fshirja e llogarisë dështoi." });
  }
};

module.exports = {
  getUserProfile,
  updatePassword,
  updateProfile,
  deleteAccount,
};
