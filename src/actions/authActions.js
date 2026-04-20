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
    return { error: "Lỗi đăng nhập" }
  }
}

export async function registerWithCredentials(formData) {
  const username = formData.get("username");
  const email = formData.get("email");
  // Bỏ qua password vì đang demo không mã hóa

  if (!username || !email) return { error: "Nhập đủ Username và Email" };

  const { prisma } = require('@/lib/prisma');
  
  const existUser = await prisma.user.findFirst({
     where: { 
       OR: [ { username: username }, { email: email } ]
     }
  });

  if (existUser) return { error: "Username hoặc Email đã tồn tại!" };

  await prisma.user.create({
    data: {
      username,
      email,
      name: username
    }
  });

  // Tự Login luôn sau khi đăng ký
  try {
    await signIn("credentials", {
      username,
      password: "123",
      redirect: false
    });
    return { success: true };
  } catch (error) {
    return { error: "Đăng ký thành công nhưng tự động đăng nhập lỗi." }
  }
}

export async function handleLogOut() {
  await signOut({ redirectTo: "/" });
}
