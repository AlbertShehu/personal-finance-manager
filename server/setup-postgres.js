#!/usr/bin/env node

/**
 * Script për të konfiguruar PostgreSQL në Railway
 * Ky script do të:
 * 1. Ndryshojë schema.prisma për PostgreSQL
 * 2. Krijon migrimet e reja
 * 3. Push-on në Railway
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up PostgreSQL for Railway...');

// 1. Backup current schema
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const backupPath = path.join(__dirname, 'prisma', 'schema.sqlite.backup');

if (fs.existsSync(schemaPath)) {
  fs.copyFileSync(schemaPath, backupPath);
  console.log('✅ Backed up current schema to schema.sqlite.backup');
}

// 2. Update schema for PostgreSQL
const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                    Int          @id @default(autoincrement())
  name                  String
  email                 String       @unique
  password              String
  emailVerifiedAt       DateTime?
  emailVerificationToken String?

  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  transactions          Transaction[]
}

model Transaction {
  id          Int             @id @default(autoincrement())
  category    String
  description String
  amount      Float
  type        TransactionType
  date        DateTime        @default(now())
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  userId      Int

  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([date])
}

enum TransactionType {
  INCOME
  EXPENSE
}`;

fs.writeFileSync(schemaPath, schemaContent);
console.log('✅ Updated schema.prisma for PostgreSQL');

// 3. Create new migration
try {
  console.log('🔄 Creating PostgreSQL migration...');
  execSync('npx prisma migrate dev --name init_postgresql', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ PostgreSQL migration created');
} catch (error) {
  console.error('❌ Failed to create migration:', error.message);
  process.exit(1);
}

// 4. Generate Prisma client
try {
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

console.log('🎉 PostgreSQL setup complete!');
console.log('📝 Next steps:');
console.log('1. Commit and push changes to Railway');
console.log('2. Railway will automatically deploy with PostgreSQL');
console.log('3. The database will be migrated automatically');
