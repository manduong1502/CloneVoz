"use client";

import { MessageSquareQuote } from 'lucide-react';

export default function QuoteButton({ username, content }) {
  const handleQuote = () => {
    // Chỉ lấy text thô nếu không muốn lồng quá sâu, hoặc lấy HTML.
    // Ở đây ta xoá HTML tag để lấy text gốc cho đơn giản.
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const textContent = tempDiv.innerText || tempDiv.textContent;

    window.dispatchEvent(new CustomEvent('insert-quote', {
      detail: {
        username: username,
        text: textContent
      }
    }));
  };

  return (
    <button onClick={handleQuote} className="flex items-center gap-1 hover:text-[var(--voz-link)]">
      <MessageSquareQuote size={14}/> Trả lời
    </button>
  );
}
