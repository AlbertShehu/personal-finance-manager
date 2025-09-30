const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'shehus722@gmail.com' }
    });
    
    if (user) {
      await prisma.user.update({
        where: { email: 'shehus722@gmail.com' },
        data: { emailVerifiedAt: new Date() }
      });
      console.log('✅ User verified successfully!');
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();
