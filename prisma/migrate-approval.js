// Script chạy trên VPS sau khi prisma db push
// Mục đích: Set tất cả thread cũ thành isApproved = true + tạo group Moderator
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // 1. Set tất cả thread cũ thành đã duyệt
  const result = await prisma.thread.updateMany({
    data: { isApproved: true }
  });
  console.log(`✅ Đã duyệt ${result.count} thread cũ.`);

  // 2. Tạo group Moderator nếu chưa có
  let modGroup = await prisma.userGroup.findUnique({ where: { name: 'Moderator' } });
  if (!modGroup) {
    modGroup = await prisma.userGroup.create({
      data: {
        name: 'Moderator',
        priority: 500,
        canBan: false,
        canDelete: true,
        canEditAny: false,
        canApprove: true
      }
    });
    console.log('✅ Đã tạo group Moderator.');
  } else {
    // Cập nhật canApprove nếu group đã tồn tại
    await prisma.userGroup.update({
      where: { id: modGroup.id },
      data: { canApprove: true }
    });
    console.log('✅ Đã cập nhật quyền canApprove cho Moderator.');
  }

  // 3. Cập nhật group Admin — canApprove = true
  let adminGroup = await prisma.userGroup.findUnique({ where: { name: 'Admin' } });
  if (adminGroup) {
    await prisma.userGroup.update({
      where: { id: adminGroup.id },
      data: { canApprove: true }
    });
    console.log('✅ Đã cập nhật quyền canApprove cho Admin.');
  }

  console.log('\n🎉 Migration hoàn tất!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
