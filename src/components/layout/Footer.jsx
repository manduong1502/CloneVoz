import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-[#185886] mt-auto py-8 text-center text-white/70 text-[13px] border-t-4 border-[#2574A9]">
      <div className="max-w-[1240px] px-4 mx-auto flex flex-col md:flex-row justify-between items-center">
        <ul className="flex flex-wrap justify-center gap-4 mb-4 md:mb-0">
          <li><span className="hover:text-white transition cursor-not-allowed opacity-50" title="Đang phát triển">Contact us</span></li>
          <li><Link href="/terms" className="hover:text-white transition">Terms and rules</Link></li>
          <li><Link href="/terms" className="hover:text-white transition">Privacy policy</Link></li>
          <li><Link href="/terms" className="hover:text-white transition">Help</Link></li>
          <li><Link href="/" className="hover:text-white transition">Home</Link></li>
        </ul>
        <div className="flex flex-col items-center md:items-end gap-1">
          <p>© 2026 VOZ.vn Clone. Community platform by DanOngThongMinh<sup>®</sup></p>
          <p className="text-white/50 text-[11px]">Học tập NextJS & React</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
