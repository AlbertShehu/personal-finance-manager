// src/lib/resend.js (CJS)
const { Resend } = require('resend');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Log Resend initialization
if (resend) {
  console.log('✅ [RESEND] Initialized with API key (length:', process.env.RESEND_API_KEY.length + ')');
} else {
  console.warn('⚠️ [RESEND] Not initialized - RESEND_API_KEY missing!');
}

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
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verifikimi i Email-it</h2>
      <p>Përshëndetje ${name},</p>
      <p>Për të aktivizuar llogarinë tënde në <b>FinMan</b>, kliko butonin më poshtë:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" 
           style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;
                  text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          Verifiko Llogarinë
        </a>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Nëse butoni nuk funksionon, kopjo këtë link dhe hapje në shfletues:
      </p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 5px; font-size: 13px; color: #333;">
        ${verifyUrl}
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Ky link është i vlefshëm për 24 orë.
      </p>
      <hr style="border:none;border-top:1px solid #eee; margin:24px 0;" />
      <p style="font-size: 12px; color: #999;">
        Nëse nuk e ke kërkuar ti, injoroje këtë email.
      </p>
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
    
    // Resend kthen: { data: { id: '...' }, error: null } ose { data: null, error: {...} }
    console.log("📊 [RESEND-VERIFY] Raw result:", JSON.stringify(result));
    
    if (result.error) {
      console.error("❌ [RESEND-VERIFY] Resend error:", result.error);
      throw new Error(result.error.message || 'Resend API error');
    }
    
    const emailId = result.data?.id || result.id || 'unknown';
    console.log("✅ [RESEND-VERIFY] Email u dërgua:", emailId, "→", to);
    return result;
  } catch (err) {
    console.error("❌ [RESEND-VERIFY] Dështoi dërgimi:", err?.message || err);
    if (err.response) {
      console.error("📊 [RESEND-VERIFY] API Response:", JSON.stringify(err.response, null, 2));
    }
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
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Rivendos fjalëkalimin</h2>
      <p>Kliko butonin më poshtë për të vendosur një fjalëkalim të ri:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="display:inline-block;padding:12px 24px;background:#FF5722;color:#fff;
                  text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          Rivendos Fjalëkalimin
        </a>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Nëse butoni nuk funksionon, kopjo këtë link dhe hapje në shfletues:
      </p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 5px; font-size: 13px; color: #333;">
        ${resetUrl}
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Ky link është i vlefshëm vetëm për 1 orë.
      </p>
      <hr style="border:none;border-top:1px solid #eee; margin:24px 0;" />
      <p style="font-size: 12px; color: #999;">
        Nëse nuk e ke kërkuar ti, injoroje këtë email dhe fjalëkalimi yt do të mbetet i njëjtë.
      </p>
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
    
    // Resend kthen: { data: { id: '...' }, error: null } ose { data: null, error: {...} }
    console.log("📊 [RESEND-RESET] Raw result:", JSON.stringify(result));
    
    if (result.error) {
      console.error("❌ [RESEND-RESET] Resend error:", result.error);
      throw new Error(result.error.message || 'Resend API error');
    }
    
    const emailId = result.data?.id || result.id || 'unknown';
    console.log("✅ [RESEND-RESET] Email u dërgua:", emailId, "→", to);
    return result;
  } catch (err) {
    console.error("❌ [RESEND-RESET] Dështoi dërgimi:", err?.message || err);
    if (err.response) {
      console.error("📊 [RESEND-RESET] API Response:", JSON.stringify(err.response, null, 2));
    }
    throw err;
  }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
