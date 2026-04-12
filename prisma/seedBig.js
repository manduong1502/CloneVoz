const { PrismaClient } = require('@prisma/client');
function getPrismaClient() { return new PrismaClient(); }
const db = getPrismaClient();

async function cleanDB() {
  await db.reaction.deleteMany({});
  await db.post.deleteMany({});
  await db.thread.deleteMany({});
  await db.threadPrefix.deleteMany({});
  await db.node.deleteMany({});
  console.log("Database reset!");
}

async function main() {
  await cleanDB();

  console.log("Seeding BIG VOZ Layout...");

  // 1. Create Admins
  let admin = await db.user.findFirst({ where: { username: 'Kuang2' }});
  if (!admin) admin = await db.user.create({ data: { username: 'Kuang2', email: 'kuang@voz.vn', passwordHash: 'hash', customTitle: 'Admin thứ hai của VOZ' }});

  let mod = await db.user.findFirst({ where: { username: 'thuyvan' }});
  if (!mod) mod = await db.user.create({ data: { username: 'thuyvan', email: 'thuyvan@voz.vn', passwordHash: 'hash', customTitle: 'Moderator' }});

  let tuannha = await db.user.findFirst({ where: { username: 'tuannhA' }});
  if (!tuannha) tuannha = await db.user.create({ data: { username: 'tuannhA', email: 'tuan@voz.vn', passwordHash: 'hash', customTitle: 'Senior Member' }});

  const users = [admin, mod, tuannha];

  // 2. The Hierarchy
  const hierarchy = [
    {
      title: 'Đại sảnh',
      children: ['Thông báo', 'Góp ý', 'Tin tức iNet', 'Review sản phẩm', 'Chia sẻ kiến thức']
    },
    {
      title: 'Máy tính',
      children: ['Tư vấn cấu hình', 'Overclocking & Cooling & Modding', 'AMD', 'Intel', 'GPU & Màn hình', 'Phần cứng chung']
    },
    {
      title: 'Di động & Thiết bị cầm tay',
      children: ['Apple', 'Android', 'Điện thoại & Máy tính bảng cũ', 'Phụ kiện thiết bị di động']
    },
    {
      title: 'Phần mềm & Games',
      children: ['Phần mềm', 'PC Gaming', 'Console', 'Mobile Gaming', 'Server & Hosting']
    },
    {
      title: 'Sản phẩm Công nghệ',
      children: ['Đồ điện tử & Cửa hàng', 'Tư vấn Thiết bị mạng', 'Smart Home & IOT']
    },
    {
      title: 'E-zone & Sinh viên',
      children: ['Lập trình - IT', 'Tài liệu học thuật - Thi cử', 'Thương mại điện tử & Startup', 'Việc làm & HR']
    },
    {
      title: 'Khu vui chơi giải trí',
      children: ['Chuyện trò linh tinh - F17', 'Điểm báo', 'Thể thao', 'Phim ảnh & Âm nhạc']
    },
    {
      title: 'Khu mua sắm',
      children: ['Máy tính để bàn', 'Laptop', 'Phụ kiện & Đồ chơi PC', 'Điện thoại mới']
    }
  ];

  let displayOrder = 10;
  const createdForums = [];

  for (const cat of hierarchy) {
    const parent = await db.node.create({
      data: { title: cat.title, nodeType: 'Category', displayOrder }
    });
    displayOrder += 10;

    let subOrder = 1;
    for (const forumTitle of cat.children) {
      const forum = await db.node.create({
        data: { title: forumTitle, parentId: parent.id, nodeType: 'Forum', displayOrder: subOrder }
      });
      createdForums.push(forum);
      subOrder++;
    }
  }

  // 3. Inject 150 Fake Threads to all forums to make it ALIVE
  const THREAD_TITLES = [
    "Khoe màn hình làm việc", "Có nên đầu tư đất nền năm nay?", "Xin kinh nghiệm chăn nuôi",
    "Góc chia sẻ phần mềm AI", "Card trâu cày xả hàng có nên múc luôn?", "Tìm việc FrontEnd lương 15tr",
    "[Chú ý] Nội quy khu mua bán v2", "Chán đời quá mấy thím ạ", "Review nhanh con iPhone mới nhất",
    "Tuyển Dev JS làm Remote", "Góc tự hào: Mình đã mua nhà ở tuổi 25", "Tư vấn case ráp máy tầm 35 triệu",
    "Sếp bắt dùng PHP thay vì Node, làm gì giờ?", "Ngày kinh hoàng đi phỏng vấn bị ném CV", "Thằng bồ em bắt cá 2 tay",
    "Thuê bao internet dạo này lag ghê", "Mua PS5 hay Xbox?", "Review trà đá 3k quán bà Thủy",
    "Nhờ tìm bài hát: ư ứ ư", "Ông nào chơi coin đoạn này cẩn thận", "Nữ dùng nên chọn điện thoại nào"
  ];
  
  console.log("Generating 150 threads scattered around...");

  for (let i = 0; i < 150; i++) {
    const randForum = createdForums[Math.floor(Math.random() * createdForums.length)];
    const randAuthor = users[Math.floor(Math.random() * users.length)];
    const tTitle = THREAD_TITLES[Math.floor(Math.random() * THREAD_TITLES.length)];

    const t = await db.thread.create({
      data: {
        title: `${tTitle} - P${i}`,
        nodeId: randForum.id,
        authorId: randAuthor.id,
        viewCount: Math.floor(Math.random() * 50000),
        replyCount: Math.floor(Math.random() * 50),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
      }
    });

    await db.post.create({
      data: {
        content: "<p>Bác nào vào chia sẻ ý kiến với ạ. Nhìn phát nản luôn.</p>",
        position: 1,
        threadId: t.id,
        authorId: randAuthor.id
      }
    });

    // Cập nhật số liệu Box
    await db.node.update({
      where: { id: randForum.id },
      data: { threadsCount: { increment: 1 }, postsCount: { increment: t.replyCount + 1 } }
    });
  }

  console.log("✅ Successfully injected entire hierarchy & 150 threads!");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
