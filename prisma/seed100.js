const { PrismaClient } = require('@prisma/client');
function getPrismaClient() {
  return new PrismaClient();
}

const db = getPrismaClient();

const THREAD_TITLES = [
  "Tư vấn cấu hình máy tính 15 triệu", "Đánh giá chi tiết iPhone 15 Pro Max", "Hướng dẫn cài đặt Windows 11",
  "Có nên mua Macbook M2 năm 2024?", "Bàn phím cơ nào gõ êm nhất dưới 1 triệu?", "Lỗi màn hình xanh khi chơi game",
  "Tản nhiệt nước AIO hay tản khí ngon hơn?", "Chuột Logitech G102 bị double click phải làm sao?",
  "Xin kinh nghiệm phỏng vấn vị trí Frontend Dev", "Tìm mua điện thoại cũ uy tín ở Hà Nội",
  "Nghề IT giờ có còn hot không anh em?", "Review ghế công thái học giá rẻ", "Share khóa học lập trình web fullstack",
  "Lương 10 củ nên mua xe máy nào?", "Khoe góc làm việc học tập góc 1 góc 2", "Laptop gaming bị quá nhiệt thường xuyên",
  "Cách tối ưu hóa hiệu suất SQL Server", "Tự học Python trong vòng 3 tháng", "[Chú ý] Tuyệt đối không share link việt hóa giả",
  "Màn hình 144Hz chơi FPS có khác biệt thật không?", "Cần tìm nguồn sỉ phụ kiện điện thoại"
];

const POST_CONTENTS = [
  "<p>Bác nào rành tư vấn em phát, em gà mờ khoản này quá.</p>",
  "<p>Mua con này là chuẩn cmnr, không phải nghĩ.</p>",
  "<p>Mình thấy tầm giá này thì lựa chọn số 1 rồi, cố tí lên bản Pro thì ngon hơn.</p>",
  "<p>Lót dép hóng các cao nhân vào giải đáp.</p>",
  "<p>Thread này sặc mùi seeder, anh em cẩn thận nha =))</p>",
  "<p>Thanks chủ thớt đã chia sẻ thông tin cực kì bổ ích!</p>",
  "<p>Cho mình xin link mua với, tìm trên shopee mãi không thấy bản màu đen.</p>",
  "<p>Này còn tùy vào nhu cầu sử dụng của bác nữa, nếu hay di chuyển thì bỏ qua đi.</p>",
  "<p>Giá này thì thêm vài trăm mua đồ xịn bảo hành chính hãng cho an tâm.</p>",
  "<p>Hóng, cùng câu hỏi với thớt ạ :D</p>"
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Generating 100 fake threads...");

  // Get existing users
  let adminUser = await db.user.findFirst({ where: { username: 'Admin' } });
  let memberUser = await db.user.findFirst({ where: { username: 'voz_er' } });

  // Fallbacks if db is empty
  if (!adminUser) {
    adminUser = await db.user.create({ data: { username: 'Admin', email: 'admin2@local', passwordHash: 'hash' }});
  }
  if (!memberUser) {
    memberUser = await db.user.create({ data: { username: 'voz_er', email: 'mem2@local', passwordHash: 'hash' }});
  }

  const users = [adminUser, memberUser];

  // Get existing forums
  const forums = await db.node.findMany({ where: { nodeType: 'Forum' } });
  if (forums.length === 0) {
    console.error("No valid Forums found. Please make sure nodeType='Forum' exists in DB.");
    return;
  }

  for (let i = 0; i < 100; i++) {
    const forum = getRandomElement(forums);
    const author = getRandomElement(users);
    
    // Random title modifier
    const titlePrefix = `[Thread ${i+1}] `;
    const rootTitle = getRandomElement(THREAD_TITLES);
    const title = Math.random() > 0.5 ? rootTitle : titlePrefix + rootTitle;

    // Create Thread
    const viewCount = getRandomInt(10, 5000);
    const repliesCount = getRandomInt(0, 15);

    const thread = await db.thread.create({
      data: {
        title: title,
        nodeId: forum.id,
        authorId: author.id,
        viewCount: viewCount,
        replyCount: repliesCount,
        createdAt: new Date(Date.now() - getRandomInt(0, 10000000000)), // Random date in past
        isPinned: Math.random() > 0.95
      }
    });

    // Create First Post
    const firstPostId = await db.post.create({
      data: {
        content: `<p>Xin chào mọi người. Như tiêu đề, ${title}. Mong anh em tư vấn hoặc đánh giá cho xôm =))</p>`,
        position: 1,
        threadId: thread.id,
        authorId: author.id,
        createdAt: thread.createdAt
      }
    });

    let lastPostCreatedId = firstPostId;

    // Create Replies
    for (let j = 0; j < repliesCount; j++) {
      const replier = getRandomElement(users);
      lastPostCreatedId = await db.post.create({
        data: {
          content: getRandomElement(POST_CONTENTS),
          position: j + 2,
          threadId: thread.id,
          authorId: replier.id,
          createdAt: new Date(thread.createdAt.getTime() + getRandomInt(1000, 100000000))
        }
      });
    }

    // Update nodes fast cache stats
    await db.node.update({
      where: { id: forum.id },
      data: {
        threadsCount: { increment: 1 },
        postsCount: { increment: repliesCount + 1 }
      }
    });

    // Optionally update user messageCount
    await db.user.update({
      where: { id: author.id },
      data: { messageCount: { increment: 1 } }
    });

    if (i % 10 === 0) console.log(`Created ${i} threads...`);
  }

  console.log("✅ Successfully injected 100 diverse threads & posts!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
