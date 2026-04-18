const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
    let original = fs.readFileSync(file, 'utf8');
    let content = original;
    
    // Backgrounds
    content = content.replace(/bg-white/g, 'bg-[var(--voz-surface)]');
    content = content.replace(/bg-\[#f9f9f9\]/g, 'bg-[var(--voz-accent)]');
    content = content.replace(/bg-\[#f5f5f5\]/g, 'bg-[var(--voz-accent)]');
    content = content.replace(/hover:bg-\[#fafafa\]/g, 'hover:bg-[var(--voz-hover)]');
    content = content.replace(/hover:bg-gray-50/g, 'hover:bg-[var(--voz-hover)]');
    content = content.replace(/bg-gray-200/g, 'bg-[var(--voz-border)]');
    content = content.replace(/hover:bg-gray-300/g, 'hover:bg-[var(--voz-border-light)]');
    
    // Borders
    content = content.replace(/border-\[#f0f0f0\]/g, 'border-[var(--voz-border-light)]');
    content = content.replace(/border-\[#dedede\]/g, 'border-[var(--voz-border)]');
    content = content.replace(/border-gray-200/g, 'border-[var(--voz-border)]');
    
    // Texts
    content = content.replace(/text-\[#141414\]/g, 'text-[var(--voz-text-strong)]');
    content = content.replace(/text-\[#8c8c8c\]/g, 'text-[var(--voz-text-muted)]');
    content = content.replace(/text-gray-500/g, 'text-[var(--voz-text-muted)]');
    content = content.replace(/text-gray-700/g, 'text-[var(--voz-text)]');
    
    // Specially for Black / White explicit
    content = content.replace(/text-black/g, 'text-[var(--voz-text-strong)]');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
});

console.log(`Chuyển đổi thành công màu sắc trên ${changedFiles} files!`);
