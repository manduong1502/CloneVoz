"use server";

import { signIn, signOut } from "@/auth";

export async function loginWithProvider(providerName) {
  await signIn(providerName, { redirectTo: "/" });
}

export async function loginWithCredentials(formData) {
  const username = formData.get("username");
  const password = formData.get("password");
  
  if (!username) return { error: "Vui lòng nhập Username" };

  try {
    await signIn("credentials", {
      username,
      password,
      redirect: false
    });
    return { success: true };
  } catch (error) {
    if (error.type === 'CredentialsSignin') {
      return { error: "Tài khoản không tồn tại" }
    }
    if (error.name !== 'AuthError') {
      throw error;
    }
    return { error: "Lỗi đăng nhập" }
  }
}

export async function registerWithCredentials(formData) {
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");

  if (!username || !email || !password) return { error: "Nhập đủ Username, Email và Mật khẩu" };

  const { prisma } = require('@/lib/prisma');
  
  const existUser = await prisma.user.findFirst({
     where: { 
       OR: [ { username: username }, { email: email } ]
     }
  });

  if (existUser) return { error: "Username hoặc Email đã tồn tại!" };

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      email,
      name: username,
      passwordHash
    }
  });

  // Tự Login luôn sau khi đăng ký
  try {
    await signIn("credentials", {
      username,
      password,
      redirect: false
    });
    return { success: true };
  } catch (error) {
    if (error.type === 'CredentialsSignin') {
      return { error: "Đăng ký thành công nhưng tự động đăng nhập lỗi." }
    }
    // NEXT_REDIRECT might be thrown by NextAuth or Next.js, so re-throw it if it's not AuthError
    if (error.name !== 'AuthError') {
      throw error;
    }
    return { error: "Lỗi hệ thống khi đăng nhập." }
  }
}

export async function handleLogOut() {
  await signOut({ redirectTo: "/" });
}
