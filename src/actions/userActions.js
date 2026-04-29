'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";


// Server Action: Cập nhật Hồ sơ cá nhân
export async function updateProfile(formData) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Vui lòng đăng nhập");

    // Chỉ chủ nhân profile mới được phép đổi
    const targetUserId = formData.get('userId');
    if (session.user.id !== targetUserId) {
       throw new Error("Không có thẩm quyền");
    }

    const newUsername = formData.get("username")?.trim() || '';
    const rawAvatarUrl = formData.get("avatarUrl") || '';
    const customTitle = formData.get("customTitle") || '';
    const signatureRaw = formData.get("signature") || '';
    const signature = signatureRaw;

    // Validate username: không chứa khoảng trắng
    if (/\s/.test(newUsername)) {
      throw new Error("Tên hiển thị không được chứa khoảng trắng (dấu cách).");
    }

    // Validate username length
    if (newUsername.length < 3 || newUsername.length > 30) {
      throw new Error("Tên hiển thị phải từ 3 đến 30 ký tự.");
    }

    // Validate username characters
    if (!/^[a-zA-Z0-9._\u00C0-\u024F\u1E00-\u1EFF]+$/.test(newUsername)) {
      throw new Error("Tên hiển thị chỉ chấp nhận chữ cái, số, dấu chấm và gạch dưới.");
    }

    // Kiểm tra username trùng (nếu đổi)
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    const oldUsername = currentUser.username;
    
    if (newUsername !== oldUsername) {
      const existingUser = await prisma.user.findUnique({ where: { username: newUsername } });
      if (existingUser) {
        throw new Error("Tên hiển thị này đã được sử dụng. Vui lòng chọn tên khác.");
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
         username: newUsername,
         avatar: rawAvatarUrl,
         customTitle: customTitle,
         signature: signature
      }
    });

    revalidatePath(`/profile/${oldUsername}`);
    revalidatePath(`/profile/${newUsername}`);
    revalidatePath('/');
    
    // Nếu đổi username, redirect về profile mới
    if (newUsername !== oldUsername) {
      const { redirect } = require('next/navigation');
      redirect(`/profile/${newUsername}`);
    }

    return { success: true, message: "Hồ sơ đã được cập nhật!" };

  } catch (error) {
    // Re-throw NEXT_REDIRECT
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    return { success: false, error: error.message || "Lỗi cục bộ" };
  }
}
