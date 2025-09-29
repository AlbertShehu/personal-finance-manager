/**
 * Verifikon nëse një email është i vlefshëm (çdo email provider)
 */
async function validateEmail(email) {
  try {
    // 1. Kontrollo formatin bazë të email-it
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Formati i email-it nuk është i vlefshëm." };
    }

    // 2. Kontrollo gjatësinë e pjesës lokale
    const localPart = email.split('@')[0];
    if (localPart.length < 1 || localPart.length > 64) {
      return { isValid: false, error: "Pjesa lokale e email-it duhet të jetë 1-64 karaktere." };
    }

    // 3. Kontrollo gjatësinë e domain-it
    const domain = email.split('@')[1];
    if (domain.length < 1 || domain.length > 253) {
      return { isValid: false, error: "Domain-i i email-it duhet të jetë 1-253 karaktere." };
    }

    // 4. Kontrollo karakteret e lejuara në pjesën lokale
    const localPartRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!localPartRegex.test(localPart)) {
      return { isValid: false, error: "Email-i përmban karaktere të palejuara." };
    }

    // 5. Kontrollo nëse përfundon me pikë (nuk lejohet)
    if (localPart.endsWith('.') || localPart.startsWith('.')) {
      return { isValid: false, error: "Pjesa lokale nuk mund të fillojë ose përfundojë me pikë." };
    }

    // 6. Kontrollo pikat e njëpasnjëshme
    if (localPart.includes('..')) {
      return { isValid: false, error: "Nuk lejohen pika të njëpasnjëshme." };
    }

    // 7. Kontrollo karakteret e lejuara në domain
    const domainRegex = /^[a-zA-Z0-9.-]+$/;
    if (!domainRegex.test(domain)) {
      return { isValid: false, error: "Domain-i përmban karaktere të palejuara." };
    }

    // 8. Kontrollo nëse domain-i ka të paktën një pikë
    if (!domain.includes('.')) {
      return { isValid: false, error: "Domain-i duhet të ketë të paktën një pikë." };
    }

    return { isValid: true, error: null };
  } catch (error) {
    console.error("❌ [EMAIL_VALIDATION] Gabim:", error);
    return { isValid: false, error: "Verifikimi i email-it dështoi." };
  }
}

module.exports = {
  validateEmail
};

