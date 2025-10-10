// src/lib/resend.js (CJS)
const { Resend } = require('resend');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendVerificationEmail({ to, name = "përdorues", token }) {
  if (!to || !token) throw new Error("sendVerificationEmail: 'to' dhe 'token' janë të detyrueshëm.");
  if (!process.env.SERVER_URL) throw new Error("sendVerificationEmail: mungon SERVER_URL në .env");
  
  // Në development, printo email-in në console në vend që ta dërgojë
  if (process.env.NODE_ENV === 'development') {
    const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
    console.log("📨 [DEV] Email verification link:", verifyUrl);
    console.log("📨 [DEV] Email would be sent to:", to);
    return { success: true, message: "Email printed to console (development mode)" };
  }

  if (!resend || !process.env.RESEND_API_KEY) {
    throw new Error("sendVerificationEmail: mungon RESEND_API_KEY në .env");
  }

  const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
  console.log("📨 [RESEND-VERIFY] Po dërgoj te:", to, "| URL:", verifyUrl);

  const subject = "✅ Verifiko email-in tënd (FinMan)";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">
        Verifiko email-in tënd për FinMan.
      </span>
      <h2>Verifikimi i Email-it</h2>
      <p>Përshëndetje ${name},</p>
      <p>Për të aktivizuar llogarinë tënde në <b>FinMan</b>, kliko linkun më poshtë:</p>
      <p><a href="${verifyUrl}" target="_blank" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verifiko Email-in</a></p>
      <p>Ose kopjo dhe ngjit këtë link në browser:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${verifyUrl}</p>
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

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FinMan <onboarding@resend.dev>',
      to,
      subject,
      html,
      text,
    });
    console.log("✅ [RESEND-VERIFY] Email u dërgua:", result.data?.id || result.id || 'unknown', "→", to);
    console.log("📊 [RESEND-VERIFY] Full response:", JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.error("❌ [RESEND-VERIFY] Dështoi dërgimi:", err?.message || err);
    console.error("📊 [RESEND-VERIFY] Full error:", JSON.stringify(err, null, 2));
    throw err;
  }
}

async function sendResetPasswordEmail({ to, token }) {
  if (!to || !token) throw new Error("sendResetPasswordEmail: 'to' dhe 'token' janë të detyrueshëm.");
  if (!process.env.BASE_URL) throw new Error("sendResetPasswordEmail: mungon BASE_URL në .env");
  
  // Në development, printo email-in në console në vend që ta dërgojë
  if (process.env.NODE_ENV === 'development') {
    const resetUrl = `${process.env.BASE_URL}/reset-password/${encodeURIComponent(token)}`;
    console.log("📨 [DEV] Password reset link:", resetUrl);
    console.log("📨 [DEV] Email would be sent to:", to);
    return { success: true, message: "Email printed to console (development mode)" };
  }

  if (!resend || !process.env.RESEND_API_KEY) {
    throw new Error("sendResetPasswordEmail: mungon RESEND_API_KEY në .env");
  }

  const resetUrl = `${process.env.BASE_URL}/reset-password/${encodeURIComponent(token)}`;
  console.log("📨 [RESEND-RESET] Po dërgoj te:", to, "| URL:", resetUrl);

  const subject = "🔒 Resetimi i fjalëkalimit (FinMan)";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">
        Vendos një fjalëkalim të ri për FinMan.
      </span>
      <h2>Rivendos fjalëkalimin</h2>
      <p>Kliko linkun më poshtë për të vendosur një fjalëkalim të ri:</p>
      <p><a href="${resetUrl}" target="_blank" style="background-color: #FF5722; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Rivendos Fjalëkalimin</a></p>
      <p>Ose kopjo dhe ngjit këtë link në browser:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${resetUrl}</p>
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

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FinMan <onboarding@resend.dev>',
      to,
      subject,
      html,
      text,
    });
    console.log("✅ [RESEND-RESET] Email u dërgua:", result.data?.id || result.id || 'unknown', "→", to);
    console.log("📊 [RESEND-RESET] Full response:", JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.error("❌ [RESEND-RESET] Dështoi dërgimi:", err?.message || err);
    console.error("📊 [RESEND-RESET] Full error:", JSON.stringify(err, null, 2));
    throw err;
  }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
