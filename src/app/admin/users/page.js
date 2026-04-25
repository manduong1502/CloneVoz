import { prisma } from '@/lib/prisma';
import UserTable from './UserTable';

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    include: { userGroups: true },
    orderBy: { createdAt: 'desc' }
  });

  // Serialize dates cho client component
  const serializedUsers = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt?.toISOString() || null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--voz-text)]">Users & Groups</h1>
          <p className="text-sm text-[var(--voz-text-muted)] mt-1">Quản lý thành viên và phân quyền. Tổng: {users.length} users</p>
        </div>
      </div>
      
      <UserTable users={serializedUsers} />
    </div>
  );
}
