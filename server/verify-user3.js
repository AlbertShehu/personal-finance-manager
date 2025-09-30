const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser3() {
  try {
    await prisma.user.update({
      where: { email: 'testuser3@gmail.com' },
      data: { emailVerifiedAt: new Date() }
    });
    console.log('✅ User 3 verified successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser3();


