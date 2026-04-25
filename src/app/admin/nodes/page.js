import { prisma } from '@/lib/prisma';
import { createNode, updateNode, deleteNode } from '@/actions/nodeActions';
import { Trash2, FolderPlus, Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import DraggableForumList from './DraggableForumList';

export default async function AdminNodesPage() {
  // Fetch all nodes
  const nodes = await prisma.node.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      _count: {
        select: { threads: true }
      }
    }
  });

  // Organize nodes conceptually Categories and basic Forums
  const categories = nodes.filter(n => n.nodeType === "Category");
  const unassignedForums = nodes.filter(n => n.nodeType !== "Category" && !n.parentId);
  
  return (
    <div className="flex flex-col gap-6 text-[var(--voz-text)]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Forums & Nodes</h1>
          <p className="text-sm text-[var(--voz-text-muted)] mt-1">Cấu trúc cây danh mục chuyên mục diễn đàn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: The Tree Viewer */}
        <div className="lg:col-span-2 flex flex-col gap-4">
           {categories.map(category => {
              const childrenNodes = nodes.filter(n => n.parentId === category.id);
              return (
                 <div key={category.id} className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
                    <div className="bg-[var(--voz-accent)] px-4 py-3 border-b border-[var(--voz-border)] flex justify-between items-center">
                       <h3 className="font-bold text-[15px]">{category.title} <span className="text-xs font-normal text-[var(--voz-text-muted)] ml-2">(Group)</span></h3>
                       
                       <div className="flex gap-2">
                          <form action={async () => {
                             "use server";
                             await deleteNode(category.id);
                          }}>
                             <button type="submit" className="p-1.5 text-[var(--voz-text-muted)] hover:text-red-500 hover:bg-[var(--voz-hover)] rounded transition" title="Delete Category">
                                <Trash2 size={16} />
                             </button>
                          </form>
                       </div>
                    </div>

                    <DraggableForumList 
                      forums={childrenNodes.map(f => ({
                        id: f.id,
                        title: f.title,
                        description: f.description,
                        displayOrder: f.displayOrder,
                        _count: f._count
                      }))}
                      categories={categories.map(c => ({ id: c.id, title: c.title }))}
                      categoryId={category.id}
                    />
                 </div>
              );
           })}

           {/* Unassigned Forums */}
           {unassignedForums.length > 0 && (
              <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-red-200 overflow-hidden mt-4">
                 <div className="bg-red-50 dark:bg-red-950/20 px-4 py-3 border-b border-red-200 dark:border-red-900 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={18} />
                    <h3 className="font-bold text-[15px] text-red-600 dark:text-red-400">Phòng chưa được xếp vào Danh mục (Mồ côi)</h3>
                 </div>
                 <div className="divide-y divide-[var(--voz-border)]">
                    {unassignedForums.map(forum => (
                        <div key={forum.id} className="px-4 py-3 flex justify-between items-center bg-[var(--voz-bg)] hover:bg-[var(--voz-hover)] transition">
                           <div className="flex items-center gap-3">
                              <LayoutList className="text-[var(--voz-link)]" size={18} />
                              <div>
                                <div className="font-semibold text-[14px]">{forum.title}</div>
                              </div>
                           </div>
                           <form action={async () => { "use server"; await deleteNode(forum.id); }}>
                              <button className="p-1.5 text-red-400 hover:text-red-600 transition"><Trash2 size={15} /></button>
                           </form>
                        </div>
                    ))}
                 </div>
              </div>
           )}
        </div>

        {/* Right Column: Add Forms */}
        <div className="flex flex-col gap-4">
           {/* Form Add Group */}
           <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] p-4">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-[15px]">
                <FolderPlus size={18} className="text-[var(--voz-link)]"/> Tạo Danh mục Mới
              </h3>
              <form action={createNode} className="flex flex-col gap-3">
                 <input type="hidden" name="nodeType" value="Category" />
                 <div>
                    <label className="text-[13px] font-semibold mb-1 block">Tên danh mục (Ví dụ: Khu vui chơi)</label>
                    <input type="text" name="title" required className="w-full border border-[var(--voz-border)] bg-[var(--voz-bg)] text-[var(--voz-text)] px-3 py-2 rounded text-sm focus:border-blue-500 outline-none" placeholder="Nhập tên danh mục..." />
                 </div>
                 <div>
                    <label className="text-[13px] font-semibold mb-1 block">Thứ tự hiển thị (Order)</label>
                    <input type="number" name="displayOrder" defaultValue="10" className="w-24 border border-[var(--voz-border)] bg-[var(--voz-bg)] text-[var(--voz-text)] px-3 py-2 rounded text-sm outline-none" />
                 </div>
                 <button type="submit" className="bg-[var(--voz-link)] hover:bg-[var(--voz-link-hover)] text-white px-4 py-2 mt-2 font-medium text-sm rounded shadow-sm">Thêm Danh Mục</button>
              </form>
           </div>

           {/* Form Add Forum */}
           <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] p-4">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-[15px]">
                <Plus size={18} className="text-emerald-600"/> Tạo Phòng ban (Forum) Mới
              </h3>
              <form action={createNode} className="flex flex-col gap-3">
                 <input type="hidden" name="nodeType" value="Forum" />
                 
                 <div>
                    <label className="text-[13px] font-semibold mb-1 block">Nằm trong danh mục</label>
                    <select name="parentId" className="w-full border border-[var(--voz-border)] bg-[var(--voz-bg)] text-[var(--voz-text)] px-3 py-2 rounded text-sm focus:border-blue-500 outline-none">
                       {categories.length === 0 && <option value="none" className="text-red-500">Bắt buộc phải tạo danh mục trước!</option>}
                       {categories.map(c => (
                         <option key={c.id} value={c.id}>{c.title}</option>
                       ))}
                    </select>
                 </div>

                 <div>
                    <label className="text-[13px] font-semibold mb-1 block">Tên phòng (Ví dụ: Chuyện trò linh tinh)</label>
                    <input type="text" name="title" required className="w-full border border-[var(--voz-border)] bg-[var(--voz-bg)] text-[var(--voz-text)] px-3 py-2 rounded text-sm focus:border-blue-500 outline-none" placeholder="Nhập tên phòng..." />
                 </div>
                 
                 <div>
                    <label className="text-[13px] font-semibold mb-1 block">Mô tả hiển thị (Tùy chọn)</label>
                    <textarea name="description" className="w-full border border-[var(--voz-border)] bg-[var(--voz-bg)] text-[var(--voz-text)] px-3 py-2 rounded text-sm outline-none h-16" placeholder="Nơi chém gió xuyên lục địa..."></textarea>
                 </div>

                 <div>
                    <label className="text-[13px] font-semibold mb-1 block">Thứ tự ưu tiên</label>
                    <input type="number" name="displayOrder" defaultValue="10" className="w-24 border border-[var(--voz-border)] bg-[var(--voz-bg)] text-[var(--voz-text)] px-3 py-2 rounded text-sm outline-none" />
                 </div>
                 
                 <button 
                  type="submit" 
                  disabled={categories.length === 0}
                  className="bg-emerald-600 disabled:bg-gray-400 hover:bg-emerald-700 text-white px-4 py-2 mt-2 font-medium text-sm rounded shadow-sm"
                 >
                  Thêm Phòng
                 </button>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
}
