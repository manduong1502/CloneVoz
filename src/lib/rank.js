// Hệ thống Công đức & Xếp hạng Thành viên

export const RANKS = [
  { min: 0,    max: 99,   title: 'Tân binh',   color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)', icon: '🌱' },
  { min: 100,  max: 299,  title: 'Tay chơi',   color: '#22C55E', bg: 'rgba(34,197,94,0.15)',   icon: '⭐' },
  { min: 300,  max: 799,  title: 'Bản lĩnh',   color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  icon: '💎' },
  { min: 800,  max: 1999, title: 'Trụ cột',    color: '#A855F7', bg: 'rgba(168,85,247,0.15)',  icon: '🔥' },
  { min: 2000, max: 4999, title: 'Đẳng cấp',   color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  icon: '👑' },
  { min: 5000, max: Infinity, title: 'Quý ông',color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   icon: '⚔️' },
];

export function getRankInfo(points) {
  const p = Math.max(0, points || 0);
  
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (p >= RANKS[i].min) {
      const rank = RANKS[i];
      const nextRank = RANKS[i + 1];
      
      // Tính % tiến trình đến mốc tiếp theo
      let progress = 100;
      if (nextRank) {
        const rangeSize = nextRank.min - rank.min;
        const current = p - rank.min;
        progress = Math.min(100, Math.round((current / rangeSize) * 100));
      }
      
      return {
        title: rank.title,
        color: rank.color,
        bg: rank.bg,
        icon: rank.icon,
        level: i + 1,
        isMax: i === RANKS.length - 1,
        progress,
        nextTitle: nextRank?.title || null,
        nextMin: nextRank?.min || null,
        currentPoints: p,
      };
    }
  }
  
  return { title: RANKS[0].title, color: RANKS[0].color, bg: RANKS[0].bg, icon: RANKS[0].icon, level: 1, isMax: false, progress: 0, nextTitle: RANKS[1].title, nextMin: RANKS[1].min, currentPoints: p };
}
