'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


// Server Action: Cập nhật Hồ sơ cá nhân
export async function updateProfile(formData) {
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

  // Validate username length
  if (newUsername.length < 3 || newUsername.length > 30) {
    return { success: false, error: "Tên hiển thị phải từ 3 đến 30 ký tự." };
  }

  // Validate username characters (cho phép dấu cách)
  if (!/^[a-zA-Z0-9._ \u00C0-\u024F\u1E00-\u1EFF]+$/.test(newUsername)) {
    return { success: false, error: "Tên hiển thị chỉ chấp nhận chữ cái, số, dấu cách, dấu chấm và gạch dưới." };
  }

  // Kiểm tra username trùng (nếu đổi)
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser) {
    return { success: false, error: "Không tìm thấy người dùng." };
  }
  const oldUsername = currentUser.username;
  
  if (newUsername !== oldUsername) {
    const existingUser = await prisma.user.findUnique({ where: { username: newUsername } });
    if (existingUser) {
      return { success: false, error: "Tên hiển thị này đã được sử dụng. Vui lòng chọn tên khác." };
    }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
         username: newUsername,
         avatar: rawAvatarUrl,
         customTitle: customTitle,
         signature: signature
      }
    });
  } catch (dbError) {
    console.error('Update profile DB error:', dbError);
    return { success: false, error: "Lỗi cập nhật cơ sở dữ liệu." };
  }

  revalidatePath(`/profile/${oldUsername}`);
  revalidatePath(`/profile/${newUsername}`);
  revalidatePath('/');
  
  // Nếu đổi username, redirect về profile mới
  if (newUsername !== oldUsername) {
    redirect(`/profile/${encodeURIComponent(newUsername)}`);
  }

  return { success: true, message: "Hồ sơ đã được cập nhật!" };
}
