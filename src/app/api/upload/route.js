import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Đảm bảo tên file an toàn
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    
    // Thư mục lưu trữ: public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    // Đường dẫn đầy đủ để ghi
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Đường dẫn trả về Front-end
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Failed to upload.' }, { status: 500 });
  }
}
