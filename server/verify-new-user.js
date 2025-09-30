const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyNewUser() {
  try {
    await prisma.user.update({
      where: { email: 'testuser@gmail.com' },
      data: { emailVerifiedAt: new Date() }
    });
    console.log('✅ New user verified successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNewUser();



