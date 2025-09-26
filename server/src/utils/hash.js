const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * 🔐 Kodon fjalëkalimin e dhënë në mënyrë të sigurt
 * @param {string} password - Fjalëkalimi origjinal (plain text)
 * @returns {Promise<string>} - Fjalëkalimi i koduar (hashed)
 */
const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Fjalëkalimi nuk mund të jetë bosh');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 🔍 Krahason një fjalëkalim të dhënë me atë të koduar
 * @param {string} plain - Fjalëkalimi që vjen nga përdoruesi (plain text)
 * @param {string} hashed - Fjalëkalimi i ruajtur në DB (hashed)
 * @returns {Promise<boolean>} - true nëse përputhen, përndryshe false
 */
const comparePassword = async (plain, hashed) => {
  if (!plain || !hashed) {
    return false;
  }
  return await bcrypt.compare(plain, hashed);
};

module.exports = {
  hashPassword,
  comparePassword,
};
