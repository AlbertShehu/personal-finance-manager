const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserDetails() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'shehus722@gmail.com' }
    });
    
    if (user) {
      console.log('User details:');
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Password hash:', user.password.substring(0, 20) + '...');
      console.log('- Email verified:', user.emailVerifiedAt);
      console.log('- Created:', user.createdAt);
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserDetails();



