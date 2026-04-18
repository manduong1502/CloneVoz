import Link from 'next/link';

export default function SearchPage() {
  return (
    <div className="w-full flex justify-center mt-2">
      <div className="voz-card w-full max-w-[800px] overflow-hidden">
        
        <div className="bg-[var(--voz-accent)] px-4 py-[10px] text-[15px] border-b border-[var(--voz-border)] text-[#185886] font-medium flex justify-between items-center">
           <span>Search threads</span>
           <Link href="#" className="font-normal text-[13px] text-[var(--voz-link)] hover:underline">Search profile posts...</Link>
        </div>

        <div className="p-4 md:p-6 bg-[var(--voz-surface)] flex flex-col gap-6 text-[13px]">
           {/* Row 1 */}
           <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="w-full md:w-[150px] text-[var(--voz-text)] font-semibold md:text-right pt-2 shrink-0">Keywords:</div>
              <div className="flex-1 flex flex-col gap-2">
                 <input type="text" className="w-full border border-[var(--voz-border)] p-[6px] rounded-[2px] focus:outline-none focus:border-[var(--voz-link)]" />
                 <label className="flex items-center gap-2 cursor-pointer text-[var(--voz-text-muted)]">
                    <input type="checkbox" /> Search titles only
                 </label>
              </div>
           </div>

           {/* Row 2 */}
           <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="w-full md:w-[150px] text-[var(--voz-text)] font-semibold md:text-right pt-2 shrink-0">Posted by:</div>
              <div className="flex-1 flex flex-col gap-2">
                 <input type="text" placeholder="Separate names with a comma." className="w-full border border-[var(--voz-border)] p-[6px] rounded-[2px] focus:outline-none focus:border-[var(--voz-link)]" />
                 <label className="flex items-center gap-2 cursor-pointer text-[var(--voz-text-muted)]">
                    <input type="checkbox" /> Exact name match
                 </label>
              </div>
           </div>

           <hr className="border-t border-[var(--voz-border-light)] my-2" />

           {/* Row 3 */}
           <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="w-full md:w-[150px] text-[var(--voz-text)] font-semibold md:text-right pt-2 shrink-0">Newer than:</div>
              <div className="flex-1">
                 <input type="date" className="border border-[var(--voz-border)] p-[6px] rounded-[2px] focus:outline-none focus:border-[var(--voz-link)] w-full md:w-auto" />
              </div>
           </div>

           {/* Row 4 */}
           <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="w-full md:w-[150px] text-[var(--voz-text)] font-semibold md:text-right pt-2 shrink-0">Minimum number of replies:</div>
              <div className="flex-1">
                 <input type="number" defaultValue="0" className="border border-[var(--voz-border)] p-[6px] rounded-[2px] focus:outline-none focus:border-[var(--voz-link)] w-[100px]" />
              </div>
           </div>

           {/* Row 5 */}
           <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="w-full md:w-[150px] text-[var(--voz-text)] font-semibold md:text-right pt-2 shrink-0">Search in forums:</div>
              <div className="flex-1">
                 <select multiple className="w-full border border-[var(--voz-border)] p-2 rounded-[2px] h-[150px] focus:outline-none focus:border-[var(--voz-link)]">
                    <option value="" disabled>All forums</option>
                    <option value="1">-- Đại sảnh</option>
                    <option value="101">---- Thông báo</option>
                    <option value="102">---- Góp ý</option>
                    <option value="2">-- Máy tính</option>
                    <option value="201">---- Tư vấn cấu hình</option>
                 </select>
              </div>
           </div>

           {/* Submit */}
           <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2">
              <div className="hidden md:block w-[150px] shrink-0"></div>
              <div className="flex-1 flex gap-2">
                 <button className="voz-button px-6">Search</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
