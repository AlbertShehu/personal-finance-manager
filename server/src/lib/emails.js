// src/lib/emails.js (CJS)
const { getMailer } = require("./mailer");

async function sendVerifyEmail({ to, name = "përdorues", token }) {
  if (!to || !token) throw new Error("sendVerifyEmail: 'to' dhe 'token' janë të detyrueshëm.");
  if (!process.env.SERVER_URL) throw new Error("sendVerifyEmail: mungon SERVER_URL në .env");
  
  // Në development, printo email-in në console në vend që ta dërgojë
  if (process.env.NODE_ENV === 'development') {
    const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
    console.log("📨 [DEV] Email verification link:", verifyUrl);
    console.log("📨 [DEV] Email would be sent to:", to);
    return { success: true, message: "Email printed to console (development mode)" };
  }
  
  if (!process.env.EMAIL_USER) throw new Error("sendVerifyEmail: mungon EMAIL_USER në .env");

  const transporter = getMailer();
  const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
  console.log("📨 [VERIFY] Po dërgoj te:", to, "| URL:", verifyUrl);

  const subject = "✅ Verifiko email-in tënd (FinMan)";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">
        Verifiko email-in tënd për FinMan.
      </span>
      <h2>Verifikimi i Email-it</h2>
      <p>Përshëndetje ${name},</p>
      <p>Për të aktivizuar llogarinë tënde në <b>FinMan</b>, kliko linkun më poshtë:</p>
      <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
      <p>Ky link është i vlefshëm për 24 orë.</p>
      <hr style="border:none;border-top:1px solid #eee; margin:16px 0;" />
      <p style="font-size: 0.9em; color: #666;">Nëse nuk e ke kërkuar ti, injoroje këtë email.</p>
    </div>
  `.trim();

  const text = [
    "Verifikimi i Email-it (FinMan)",
    `Përshëndetje ${name},`,
    "Për të aktivizuar llogarinë tënde në FinMan, hap linkun më poshtë:",
    verifyUrl,
    "Ky link vlen 24 orë.",
    "Nëse nuk e ke kërkuar ti, injoroje këtë email."
  ].join("\n\n");

  const mailOptions = {
    from: `FinMan <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions); // ← vetëm një herë
    console.log("✅ [VERIFY] Email u dërgua:", info.messageId, "→", to);
    return info;
  } catch (err) {
    console.error("❌ [VERIFY] Dështoi dërgimi:", err?.message || err);
    throw err;
  }
}

async function sendResetEmail({ to, token }) {
  if (!to || !token) throw new Error("sendResetEmail: 'to' dhe 'token' janë të detyrueshëm.");
  if (!process.env.BASE_URL) throw new Error("sendResetEmail: mungon BASE_URL në .env");
  if (!process.env.EMAIL_USER) throw new Error("sendResetEmail: mungon EMAIL_USER në .env");

  const transporter = getMailer();
  const resetUrl = `${process.env.BASE_URL}/reset-password/${encodeURIComponent(token)}`;
  console.log("📨 [RESET] Po dërgoj te:", to, "| URL:", resetUrl);

  const subject = "🔒 Resetimi i fjalëkalimit (FinMan)";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">
        Vendos një fjalëkalim të ri për FinMan.
      </span>
      <h2>Rivendos fjalëkalimin</h2>
      <p>Kliko linkun më poshtë për të vendosur një fjalëkalim të ri:</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      <p>Ky link është i vlefshëm vetëm për 1 orë.</p>
      <hr style="border:none;border-top:1px solid #eee; margin:16px 0;" />
      <p style="font-size: 0.9em; color: #666;">Nëse nuk e ke kërkuar ti, injoroje këtë email.</p>
    </div>
  `.trim();

  const text = [
    "Rivendos fjalëkalimin (FinMan)",
    "Kliko linkun për të vendosur një fjalëkalim të ri:",
    resetUrl,
    "Linku vlen 1 orë.",
    "Nëse nuk e ke kërkuar ti, injoroje këtë email."
  ].join("\n\n");

  const mailOptions = {
    from: `FinMan <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions); // ← vetëm një herë
    console.log("✅ [RESET] Email u dërgua:", info.messageId, "→", to);
    return info;
  } catch (err) {
    console.error("❌ [RESET] Dështoi dërgimi:", err?.message || err);
    throw err;
  }
}

/** Prevent HTML injection në emër */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = { sendVerifyEmail, sendResetEmail };
