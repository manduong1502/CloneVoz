const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function run() { 
  let adminGroup = await prisma.userGroup.findUnique({where: {name: 'Admin'}}); 
  if (!adminGroup) { 
    adminGroup = await prisma.userGroup.create({
      data: {name: 'Admin', priority: 1000, canBan: true, canDelete: true, canEditAny: true}
    }); 
  } 

  // Set the current user to be admin for convenience
  const user = await prisma.user.findUnique({where: {email: "mandtdn@gmail.com"}});
  if (user) {
     await prisma.user.update({
        where: { id: user.id },
        data: {
           userGroups: {
              connect: { id: adminGroup.id }
           }
        }
     });
     console.log("Admin role set for user: mandtdn@gmail.com");
  } else {
     console.log("User not found yet.");
  }
} 
run().catch(console.error).finally(() => prisma.$disconnect());
