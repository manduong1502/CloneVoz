import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/auth';

// Cấu hình Cloudinary (Yêu cầu phải có 3 khóa trong file .env)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
       return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Không nhận được file.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Gửi thẳng Buffer lên Cloudinary thông qua Stream
    const publicUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "diendan_danong" }, // Tên thư mục chứa ảnh trên Cloudinary
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url); // Lấy link ổ khóa xanh HTTPS của ảnh
        }
      );
      
      // Bơm dữ liệu thô vào ống hút để tải lên
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Tải ảnh lên thư viện Đám mây thất bại.' }, { status: 500 });
  }
}
