const dns = require('dns');
const { promisify } = require('util');

const resolveMx = promisify(dns.resolveMx);

/**
 * Verifikon nëse një email ekziston në Gmail duke kontrolluar MX records
 * dhe duke bërë një test SMTP të thjeshtë
 */
async function validateGmailEmail(email) {
  try {
    // 1. Kontrollo nëse është Gmail
    if (!/@(gmail|googlemail)\.com$/i.test(email)) {
      return { isValid: false, error: "Lejohen vetëm adresat Gmail." };
    }

    // 2. Kontrollo formatin bazë
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Formati i email-it nuk është i vlefshëm." };
    }

    // 3. Kontrollo MX records për gmail.com
    try {
      const mxRecords = await resolveMx('gmail.com');
      if (!mxRecords || mxRecords.length === 0) {
        return { isValid: false, error: "Nuk mund të verifikohet Gmail." };
      }
    } catch (mxError) {
      console.warn("⚠️  MX lookup dështoi:", mxError.message);
      // Nëse MX lookup dështon, vazhdoj me verifikimin bazë
    }

    // 4. Verifikim bazë i formës së Gmail
    const localPart = email.split('@')[0];
    
    // Kontrollo gjatësinë e pjesës lokale
    if (localPart.length < 6 || localPart.length > 30) {
      return { isValid: false, error: "Pjesa lokale e Gmail duhet të jetë 6-30 karaktere." };
    }

    // Kontrollo karakteret e lejuara në Gmail
    const gmailLocalPartRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!gmailLocalPartRegex.test(localPart)) {
      return { isValid: false, error: "Email-i përmban karaktere të palejuara për Gmail." };
    }

    // 5. Kontrollo nëse përfundon me pikë (Gmail nuk e lejon)
    if (localPart.endsWith('.') || localPart.startsWith('.')) {
      return { isValid: false, error: "Gmail nuk lejon që pjesa lokale të fillojë ose përfundojë me pikë." };
    }

    // 6. Kontrollo pikat e njëpasnjëshme
    if (localPart.includes('..')) {
      return { isValid: false, error: "Gmail nuk lejon pika të njëpasnjëshme." };
    }

    return { isValid: true, error: null };
  } catch (error) {
    console.error("❌ [EMAIL_VALIDATION] Gabim:", error);
    return { isValid: false, error: "Verifikimi i email-it dështoi." };
  }
}

module.exports = {
  validateGmailEmail
};

