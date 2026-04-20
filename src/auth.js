import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: async (data) => {
      return prisma.user.create({
        data: {
          email: data.email,
          emailVerified: data.emailVerified,
          username: data.name || data.email.split('@')[0],
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
      name: "Tài khoản (Mock)",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Ví dụ: Kuang2 (Admin)" },
        password: { label: "Password", type: "password", placeholder: "Gì cũng được" }
      },
      async authorize(credentials) {
        if (!credentials?.username) return null;

        // Auto-match user for demo purposes
        const user = await prisma.user.findFirst({
           where: { username: credentials.username }
        })

        if (user) {
           return { 
              id: user.id, 
              name: user.username, 
              email: user.email, 
              image: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`
           }
        }
        return null;
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
               select: { name: true }
            }
          }
        });
        
        if (dbUser) {
          session.user.name = dbUser.username;
          session.user.image = dbUser.avatar;
          session.user.isAdmin = dbUser.userGroups.some(g => g.name === 'Admin');
        }
      }
      return session;
    }
  }
})
