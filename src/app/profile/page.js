import { redirect } from 'next/navigation';

export default function ProfileIndex() {
  // Tạm thời redirect sang profile giả lập của Admin khi chưa có auth
  redirect('/profile/Admin');
}
