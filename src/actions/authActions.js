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

export async function handleLogOut() {
  await signOut({ redirectTo: "/" });
}
