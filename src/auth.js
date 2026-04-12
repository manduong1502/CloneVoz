import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "default_super_secret_dev_key",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
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
      }
      return session;
    }
  }
})
