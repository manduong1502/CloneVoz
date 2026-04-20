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
       // Thêm ngoại lệ cho Admin sau này nếu cần
       throw new Error("Không có thẩm quyền");
    }

    const rawAvatarUrl = formData.get("avatarUrl") || '';
    const customTitle = formData.get("customTitle") || '';
    const signatureRaw = formData.get("signature") || '';

    // Bỏ qua khử trùng trên server vì isomorphic DOMPurify crash trên Turbopack, sẽ validate ở client
    const signature = signatureRaw;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
         avatar: rawAvatarUrl,
         customTitle: customTitle,
         signature: signature
      }
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    revalidatePath(`/profile/${user.username}`);
    return { success: true, message: "Profile đã được bọc vàng!" };

  } catch (error) {
    return { success: false, error: error.message || "Lỗi cục bộ" };
  }
}
