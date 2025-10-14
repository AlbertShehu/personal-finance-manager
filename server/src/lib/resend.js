// server/src/lib/resend.js (CJS)
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

if (resend) {
  console.log('✅ [RESEND] Initialized');
} else {
  console.warn('⚠️ [RESEND] Not initialized - RESEND_API_KEY missing!');
}

// Helper: merr FROM nga env, dhe në prod kërko domosdoshmërisht domen të verifikuar
function getFrom() {
  const fallback = 'FinMan <no-reply@send.finman-app.com>';
  const from = (process.env.EMAIL_FROM || '').trim() || fallback;
  // në prod mos lejo resend.dev
  if (process.env.NODE_ENV === 'production' && from.includes('@resend.dev')) {
    throw new Error('EMAIL_FROM duhet të jetë në domenin e verifikuar (p.sh. no-reply@send.finman-app.com), jo @resend.dev');
  }
  return from;
}

async function sendVerificationEmail({ to, name = 'përdorues', token, language = 'sq' }) {
  if (!to || !token) throw new Error("sendVerificationEmail: 'to' dhe 'token' janë të detyrueshëm.");
  if (!process.env.SERVER_URL) throw new Error("sendVerificationEmail: mungon SERVER_URL në .env");

  const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV === 'development') {
    console.log('📨 [DEV] Email verification link:', verifyUrl, '→', to);
    return { success: true, message: 'Email printed to console (development mode)' };
  }
  if (!resend) throw new Error('sendVerificationEmail: RESEND_API_KEY mungon');

  // Email templates për të trija gjuhët
  const emailTemplates = {
    sq: {
      subject: '✅ Verifiko email-in tënd (FinMan)',
      title: 'Verifikimi i Email-it',
      greeting: `Përshëndetje ${name},`,
      message: 'Për të aktivizuar llogarinë tënde në <b>FinMan</b>, kliko butonin më poshtë:',
      button: 'Verifiko Llogarinë',
      fallback: 'Nëse butoni nuk funksionon, kopjo këtë link dhe hapje në shfletues:',
      expiry: 'Ky link është i vlefshëm për 24 orë.',
      footer: 'Ekipi i FinMan'
    },
    en: {
      subject: '✅ Verify your email (FinMan)',
      title: 'Email Verification',
      greeting: `Hello ${name},`,
      message: 'To activate your account on <b>FinMan</b>, click the button below:',
      button: 'Verify Account',
      fallback: 'If the button doesn\'t work, copy this link and open it in your browser:',
      expiry: 'This link is valid for 24 hours.',
      footer: 'The FinMan Team'
    },
    de: {
      subject: '✅ E-Mail verifizieren (FinMan)',
      title: 'E-Mail-Verifizierung',
      greeting: `Hallo ${name},`,
      message: 'Um dein Konto bei <b>FinMan</b> zu aktivieren, klicke auf den Button unten:',
      button: 'Konto verifizieren',
      fallback: 'Falls der Button nicht funktioniert, kopiere diesen Link und öffne ihn in deinem Browser:',
      expiry: 'Dieser Link ist 24 Stunden gültig.',
      footer: 'Das FinMan Team'
    }
  };

  const template = emailTemplates[language] || emailTemplates.sq;
  const subject = template.subject;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${template.title}</h2>
      <p>${template.greeting}</p>
      <p>${template.message}</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          ${template.button}
        </a>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 30px;">${template.fallback}</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 5px; font-size: 13px; color: #333;">
        ${verifyUrl}
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">${template.expiry}</p>
      <hr style="border:none;border-top:1px solid #eee; margin:24px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">${template.footer}</p>
    </div>
  `.trim();

  const text = [
    template.title + ' (FinMan)',
    template.greeting,
    template.message.replace(/<[^>]*>/g, ''), // Remove HTML tags
    verifyUrl,
    template.expiry,
    template.footer
  ].join('\n\n');

  const result = await resend.emails.send({
    from: getFrom(),                 // ✅ përdor domenin e verifikuar p.sh. no-reply@send.finman-app.com
    to,
    subject,
    html,
    text,
    // deliverability-friendly: mbaj minimumin
    reply_to: 'support@finman-app.com',
    headers: {
      'List-Unsubscribe': '<mailto:unsubscribe@finman-app.com>'
    },
    tags: [
      { name: 'category', value: 'verification' },
      { name: 'type', value: 'account' }
    ]
  });

  if (result.error) throw new Error(result.error.message || 'Resend API error');
  console.log('✅ [RESEND-VERIFY] Email u dërgua:', (result.data?.id || 'unknown'), '→', to);
  return result;
}

async function sendResetPasswordEmail({ to, token, language = 'sq' }) {
  if (!to || !token) throw new Error("sendResetPasswordEmail: 'to' dhe 'token' janë të detyrueshëm.");
  if (!process.env.BASE_URL) throw new Error("sendResetPasswordEmail: mungon BASE_URL në .env");

  const resetUrl = `${process.env.BASE_URL}/reset-password/${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV === 'development') {
    console.log('📨 [DEV] Password reset link:', resetUrl, '→', to);
    return { success: true, message: 'Email printed to console (development mode)' };
  }
  if (!resend) throw new Error('sendResetPasswordEmail: RESEND_API_KEY mungon');

  // Reset password templates për të trija gjuhët
  const resetTemplates = {
    sq: {
      subject: '🔒 Resetimi i fjalëkalimit (FinMan)',
      title: 'Rivendos fjalëkalimin',
      message: 'Kliko butonin më poshtë për të vendosur një fjalëkalim të ri:',
      button: 'Rivendos Fjalëkalimin',
      fallback: 'Nëse butoni nuk funksionon, kopjo këtë link dhe hapje në shfletues:',
      expiry: 'Ky link është i vlefshëm vetëm për 1 orë.',
      footer: 'Ekipi i FinMan'
    },
    en: {
      subject: '🔒 Password Reset (FinMan)',
      title: 'Reset Password',
      message: 'Click the button below to set a new password:',
      button: 'Reset Password',
      fallback: 'If the button doesn\'t work, copy this link and open it in your browser:',
      expiry: 'This link is valid for only 1 hour.',
      footer: 'The FinMan Team'
    },
    de: {
      subject: '🔒 Passwort zurücksetzen (FinMan)',
      title: 'Passwort zurücksetzen',
      message: 'Klicke auf den Button unten, um ein neues Passwort zu setzen:',
      button: 'Passwort zurücksetzen',
      fallback: 'Falls der Button nicht funktioniert, kopiere diesen Link und öffne ihn in deinem Browser:',
      expiry: 'Dieser Link ist nur 1 Stunde gültig.',
      footer: 'Das FinMan Team'
    }
  };

  const template = resetTemplates[language] || resetTemplates.sq;
  const subject = template.subject;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${template.title}</h2>
      <p>${template.message}</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#FF5722;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          ${template.button}
        </a>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 30px;">${template.fallback}</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 5px; font-size: 13px; color: #333;">
        ${resetUrl}
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">${template.expiry}</p>
      <hr style="border:none;border-top:1px solid #eee; margin:24px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">${template.footer}</p>
    </div>
  `.trim();

  const text = [
    template.title + ' (FinMan)',
    template.message.replace(/<[^>]*>/g, ''), // Remove HTML tags
    resetUrl,
    template.expiry,
    template.footer
  ].join('\n\n');

  const result = await resend.emails.send({
    from: getFrom(),
    to,
    subject,
    html,
    text,
    reply_to: 'support@finman-app.com',
    headers: {
      'List-Unsubscribe': '<mailto:unsubscribe@finman-app.com>'
    },
    tags: [
      { name: 'category', value: 'password-reset' },
      { name: 'type', value: 'security' }
    ]
  });

  if (result.error) throw new Error(result.error.message || 'Resend API error');
  console.log('✅ [RESEND-RESET] Email u dërgua:', (result.data?.id || 'unknown'), '→', to);
  return result;
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
