// Safe production seed: only runs if database is empty
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log('Database already has data (' + count + ' users). Skipping seed.');
    return;
  }

  console.log('Empty database detected. Seeding initial data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.create({
    data: { name: 'Budi Santoso', email: 'owner@yescare.com', password_hash: passwordHash, role: 'owner' },
  });

  const sales1 = await prisma.user.create({
    data: { name: 'Andi Wijaya', email: 'andi@yescare.com', password_hash: passwordHash, role: 'sales' },
  });

  const sales2 = await prisma.user.create({
    data: { name: 'Sari Dewi', email: 'sari@yescare.com', password_hash: passwordHash, role: 'sales' },
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await prisma.task.create({
    data: {
      user_id: sales1.id, account_name: 'PT Maju Bersama',
      task_type: 'proposal', title: 'Kirim proposal sistem ERP',
      deadline: tomorrow, status: 'on_track',
    },
  });

  await prisma.task.create({
    data: {
      user_id: sales2.id, account_name: 'PT Solusi Digital',
      task_type: 'document_submission', title: 'Submit dokumen TKDN',
      deadline: tomorrow, status: 'on_track',
    },
  });

  console.log('Seed selesai!');
  console.log('  owner@yescare.com / password123');
  console.log('  andi@yescare.com / password123');
  console.log('  sari@yescare.com / password123');
}

main()
  .catch((e) => { console.error('Seed error:', e.message); process.exit(0); }) // exit 0 to not break build
  .finally(async () => { await prisma.$disconnect(); });
