// lib/prisma.js
const { PrismaClient } = require('@prisma/client');

let prisma;

/**
 * ✅ Në production: krijo instancë të re të PrismaClient
 * ✅ Në development: ruaj një instancë globale për të shmangur ri-inicializime
 *    kur përdorim nodemon (ndryshon skedarët dhe rindez aplikacionin)
 */
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}


module.exports = prisma;
