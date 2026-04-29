import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: async (data) => {
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
    async jwt({ token, trigger }) {
      // Chỉ query DB khi: đăng nhập lần đầu, hoặc mỗi 5 phút
      const now = Math.floor(Date.now() / 1000);
      const lastRefresh = token.lastRefresh || 0;
      const needsRefresh = !token.dbUsername || (now - lastRefresh > 300); // 5 phút

      if (token.sub && (needsRefresh || trigger === 'update')) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { 
            username: true, 
            avatar: true,
            email: true,
            userGroups: {
               select: { name: true, canApprove: true, canBan: true, canDelete: true, canEditAny: true }
            }
          }
        });
        
        if (dbUser) {
          token.dbUsername = dbUser.username;
          token.dbAvatar = dbUser.avatar;
          token.dbEmail = dbUser.email;
          token.isAdmin = dbUser.userGroups.some(g => g.name === 'Admin');
          token.isMod = dbUser.userGroups.some(g => g.name === 'Moderator');
          token.canApprove = dbUser.userGroups.some(g => g.canApprove);
          token.canDelete = dbUser.userGroups.some(g => g.canDelete);
          token.lastRefresh = now;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
        // Đọc từ JWT cache, KHÔNG query DB
        session.user.name = token.dbUsername || session.user.name;
        session.user.username = token.dbUsername || session.user.name;
        session.user.image = token.dbAvatar || session.user.image;
        session.user.email = token.dbEmail || session.user.email;
        session.user.isAdmin = token.isAdmin || false;
        session.user.isMod = token.isMod || false;
        session.user.canApprove = token.canApprove || false;
        session.user.canDelete = token.canDelete || false;
      }
      return session;
    }
  }
})
