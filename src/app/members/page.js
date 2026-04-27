import Link from 'next/link';

export default function MembersPage() {
  const topMembers = [
    { id: 1, name: 'fRzzy', title: 'Lãnh tụ', messages: '124,500', reactionScore: '502,300', points: 113, joined: 'Jan 1, 2010' },
    { id: 2, name: 'Kuang2', title: 'Admin thứ hai', messages: '45,210', reactionScore: '189,400', points: 113, joined: 'Feb 15, 2014' },
    { id: 3, name: 'thuyvan', title: 'Moderator', messages: '89,500', reactionScore: '210,000', points: 45, joined: 'Mar 10, 2018' },
    { id: 4, name: 'bachngoc', title: 'Senior Member', messages: '32,100', reactionScore: '88,900', points: 28, joined: 'Jun 22, 2020' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
      <div className="flex flex-col">
        <div className="mb-4">
          <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">Thành viên nổi bật</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--voz-border)] mb-4 text-[13px]">
          <Link href="/members" className="px-4 py-2 border-b-[3px] border-[#185886] font-semibold text-[#185886]">Nhiều bài viết nhất</Link>
          <Link href="#" className="px-4 py-2 border-b-[3px] border-transparent hover:border-[#2574A9]/50 text-[var(--voz-text-muted)] hover:text-[#185886] hidden sm:block">Nhiều lượt thích nhất</Link>
          <Link href="#" className="px-4 py-2 border-b-[3px] border-transparent hover:border-[#2574A9]/50 text-[var(--voz-text-muted)] hover:text-[#185886] hidden sm:block">Nhiều điểm nhất</Link>
        </div>

        <div className="voz-card overflow-hidden">
          <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-[8px] text-[13px] text-[#185886] font-medium">
             Nhiều bài viết nhất
          </div>
          
          <div className="bg-[var(--voz-surface)]">
            {topMembers.map((member, index) => (
              <div key={member.id} className="flex p-4 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-hover)] last:border-0 transition-colors">
                <div className="shrink-0 mr-4">
                   <img src={`https://ui-avatars.com/api/?name=${member.name.charAt(0)}&background=random&size=100`} className="w-[64px] h-[64px] rounded-sm object-cover border border-black/10 shadow-sm" />
                </div>
                
                <div className="flex-1 flex flex-col min-w-0 pr-4">
                  <div className="text-[16px] mb-1 leading-tight flex items-center gap-2">
                    <span className="font-bold text-[var(--voz-text-muted)]">#{index + 1}</span>
                    <Link href={`/profile/${member.name}`} className="font-bold hover:underline text-[var(--voz-link)]">
                      {member.name}
                    </Link>
                  </div>
                  <div className="text-[12px] text-[var(--voz-text-muted)] mb-2">{member.title}</div>
                  
                  <div className="text-[12px] text-[var(--voz-text-muted)] flex flex-wrap items-center gap-4">
                    <div className="flex flex-col">
                       <span className="text-[var(--voz-text-strong)] font-medium">{member.messages}</span>
                       <span className="text-[10px] uppercase">Bài viết</span>
                    </div>
                    <div className="flex flex-col scale-y-[-1] border-l border-[var(--voz-border-light)] h-[24px]"></div>
                    <div className="flex flex-col">
                       <span className="text-[var(--voz-text-strong)] font-medium">{member.reactionScore}</span>
                       <span className="text-[10px] uppercase">Lượt thích</span>
                    </div>
                    <div className="flex flex-col scale-y-[-1] border-l border-[var(--voz-border-light)] h-[24px]"></div>
                    <div className="flex flex-col">
                       <span className="text-[var(--voz-text-strong)] font-medium">{member.points}</span>
                       <span className="text-[10px] uppercase">Điểm</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-4 pt-[46px]">
        {/* Find Member */}
        <div className="voz-card overflow-hidden">
          <h3 className="bg-[var(--voz-accent)] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[#185886]">Tìm thành viên</h3>
          <div className="bg-[var(--voz-surface)] px-3 py-3">
             <input type="text" placeholder="Name..." className="w-full border border-[var(--voz-border)] rounded-[2px] px-2 py-[6px] text-[13px] focus:outline-none focus:border-[var(--voz-link)] mb-2" />
             <button className="bg-[#185886] hover:bg-[#2574A9] text-white w-full rounded-[2px] py-[6px] text-[13px] font-medium transition-colors">Tìm kiếm</button>
          </div>
        </div>

        {/* Member Online */}
        <div className="voz-card overflow-hidden">
          <h3 className="bg-[var(--voz-accent)] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[#185886]">Thành viên trực tuyến</h3>
          <div className="bg-[var(--voz-surface)] px-3 py-3 text-[12px] text-[var(--voz-text-muted)]">
             <div className="flex flex-wrap gap-1 mb-2">
               <Link href="#" className="hover:underline text-[var(--voz-link)] font-medium">Bimbim2002</Link>, 
               <Link href="#" className="hover:underline text-[var(--voz-link)] font-medium">VozTroller_9x</Link>, 
               <Link href="#" className="hover:underline text-[#c84448] font-bold">thuyvan</Link>
             </div>
             <div className="border-t border-[var(--voz-border-light)] pt-2 mt-2">
                Total: 24.012 (thành viên: 1.400, khách: 22.612)
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
