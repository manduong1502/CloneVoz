const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // 1. Settings
  await prisma.globalSetting.upsert({
    where: { key: 'site_title' },
    update: {},
    create: { key: 'site_title', value: 'VOZ.vn Clone' },
  });
  await prisma.globalSetting.upsert({
    where: { key: 'site_description' },
    update: {},
    create: { key: 'site_description', value: 'Diễn đàn công nghệ lớn nhất Việt Nam' },
  });

  // 2. User Groups
  const groupAdmin = await prisma.userGroup.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', priority: 1000, canBan: true, canDelete: true, canEditAny: true },
  });
  const groupMember = await prisma.userGroup.upsert({
    where: { name: 'Registered' },
    update: {},
    create: { name: 'Registered', priority: 10 },
  });

  // 3. Users
  const adminUser = await prisma.user.upsert({
    where: { username: 'Admin' },
    update: {},
    create: {
      username: 'Admin',
      email: 'admin@voz.vn.local',
      passwordHash: 'dummy_hash_123', // Demo using dummy
      avatar: 'https://ui-avatars.com/api/?name=Admin',
      customTitle: 'Trùm Cuối',
      userGroups: { connect: [{ id: groupAdmin.id }] }
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { username: 'voz_er' },
    update: {},
    create: {
      username: 'voz_er',
      email: 'mem@voz.vn.local',
      passwordHash: 'dummy_hash_123',
      customTitle: 'Senior Member',
      userGroups: { connect: [{ id: groupMember.id }] }
    },
  });

  // 4. Nodes (Categories and Forums)
  // Clean up existing nodes safely or just assume fresh
  const nodeDaiSanh = await prisma.node.create({
    data: { title: 'Đại sảnh', nodeType: 'Category', displayOrder: 10 }
  });
  const nodeMayTinh = await prisma.node.create({
    data: { title: 'Máy tính', nodeType: 'Category', displayOrder: 20 }
  });

  const forumThongBao = await prisma.node.create({
    data: { title: 'Thông báo', parentId: nodeDaiSanh.id, nodeType: 'Forum', displayOrder: 1 }
  });
  const forumGopY = await prisma.node.create({
    data: { title: 'Góp ý', parentId: nodeDaiSanh.id, nodeType: 'Forum', displayOrder: 2 }
  });
  const forumTuVan = await prisma.node.create({
    data: { title: 'Tư vấn cấu hình', parentId: nodeMayTinh.id, nodeType: 'Forum', displayOrder: 1 }
  });

  // 5. Prefixes
  const prefixChuY = await prisma.threadPrefix.create({
    data: {
      title: 'chú ý',
      cssClass: 'voz-badge-warning',
      nodes: { connect: [{ id: forumThongBao.id }, { id: forumGopY.id }] }
    }
  });

  // 6. Threads and Posts
  const thread1 = await prisma.thread.create({
    data: {
      title: 'Nội quy diễn đàn cập nhật 2026',
      nodeId: forumThongBao.id,
      authorId: adminUser.id,
      prefixId: prefixChuY.id,
      isPinned: true,
      viewCount: 15400,
      replyCount: 0
    }
  });

  await prisma.post.create({
    data: {
      content: '<p>Tất cả mọi người phải tuân thủ nghiêm ngặt các quy định văn hóa diễn đàn...</p>',
      position: 1,
      threadId: thread1.id,
      authorId: adminUser.id
    }
  });

  const thread2 = await prisma.thread.create({
    data: {
      title: 'Build PC 20 củ chơi game AAA',
      nodeId: forumTuVan.id,
      authorId: memberUser.id,
      viewCount: 350,
      replyCount: 1
    }
  });

  await prisma.post.create({
    data: {
      content: '<p>Nhờ anh em build hộ bộ PC 20 củ không màn.</p>',
      position: 1,
      threadId: thread2.id,
      authorId: memberUser.id
    }
  });
  await prisma.post.create({
    data: {
      content: '<p>Mua i5 12400F + RTX 4060 là best tầm này nhé bác!</p>',
      position: 2,
      threadId: thread2.id,
      authorId: adminUser.id
    }
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
