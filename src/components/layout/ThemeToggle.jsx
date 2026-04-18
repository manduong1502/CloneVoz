"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Chỉ render sau khi mount để tránh lỗi Hydration mismatch giữa SSR và Client
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8"></div>;

  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-[var(--voz-hover)] transition-colors text-[var(--voz-text-muted)] hover:text-[var(--voz-text-strong)]"
      title="Bật/Tắt Chế độ ban đêm"
    >
      {currentTheme === "dark" ? (
         <Sun size={20} />
      ) : (
         <Moon size={20} />
      )}
    </button>
  );
}
