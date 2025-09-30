const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  try {
    const prisma = new PrismaClient();
    console.log('✅ Prisma client created successfully');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const users = await prisma.user.findMany();
    console.log('✅ Database query successful, users found:', users.length);
    
    await prisma.$disconnect();
    console.log('✅ Prisma client disconnected successfully');
  } catch (error) {
    console.error('❌ Prisma error:', error);
  }
}

testPrisma();



