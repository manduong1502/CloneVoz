import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: async (data) => {
      // Dùng email prefix làm username mặc định thay vì tên Google
      // VD: manduong1502@gmail.com -> username: manduong1502
      // Email đã là @unique, prefix của nó cũng gần như không thể trùng
      let baseUsername = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!baseUsername) baseUsername = 'user';
      let finalUsername = baseUsername;
      let counter = 1;

      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
         finalUsername = `${baseUsername}${counter}`;
         counter++;
      }

      return prisma.user.create({
        data: {
          email: data.email,
          emailVerified: data.emailVerified,
          username: finalUsername,
          avatar: data.image || null,
        }
      });
    }
  },
  secret: process.env.AUTH_SECRET || "default_super_secret_dev_key",
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google(),
    CredentialsProvider({
      name: "Tài khoản",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
           where: { username: credentials.username }
        });

        if (!user || !user.passwordHash) return null;

        // Verify password with bcrypt
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return { 
           id: user.id, 
           name: user.username, 
           email: user.email, 
           image: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
        
        // Fetch real username, avatar and userGroups from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { 
            username: true, 
            avatar: true,
            userGroups: {
               select: { name: true, canApprove: true, canBan: true, canDelete: true, canEditAny: true }
            }
          }
        });
        
        if (dbUser) {
          session.user.name = dbUser.username;
          session.user.image = dbUser.avatar;
          session.user.isAdmin = dbUser.userGroups.some(g => g.name === 'Admin');
          session.user.isMod = dbUser.userGroups.some(g => g.name === 'Moderator');
          session.user.canApprove = dbUser.userGroups.some(g => g.canApprove);
          session.user.canDelete = dbUser.userGroups.some(g => g.canDelete);
        }
      }
      return session;
    }
  }
})
