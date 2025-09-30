const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (verified: ${user.isVerified})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();



