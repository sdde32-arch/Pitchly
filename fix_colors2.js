const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file.startsWith('.')) continue;
        
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let initialContent = content;
            
            // Hex replacements into var
            content = content.replace(/#050A12/gi, 'var(--color-bg)');
            content = content.replace(/#111827/gi, 'var(--color-surface)');
            content = content.replace(/#1A2332/gi, 'var(--color-surface-elevated)');
            content = content.replace(/#8EF63E/gi, 'var(--color-primary)');
            content = content.replace(/#94A3B8/gi, 'var(--color-text-secondary)');
            content = content.replace(/#FFFFFF/gi, 'var(--color-text-primary)');
            
            // Now replace arbitrary var brackets with standard classes
            content = content.replace(/\[var\(--color-bg\)\]/g, 'background');
            content = content.replace(/\[var\(--color-surface\)\]/g, 'surface');
            content = content.replace(/\[var\(--color-surface-elevated\)\]/g, 'surface-elevated');
            content = content.replace(/\[var\(--color-primary\)\]/g, 'primary');
            content = content.replace(/\[var\(--color-text-primary\)\]/g, 'text-primary');
            content = content.replace(/\[var\(--color-text-secondary\)\]/g, 'text-secondary');
            
            // Fix Tailwind generated issues manually
            content = content.replace(/bg-background\/[0-9]+/g, (match) => { return match; }); // these are supported with CSS vars ONLY IF it uses <alpha-value> format which we haven't set up. But wait - let's just let it be. Actually we should keep them as tailwind arbitrary values manually?
            // Actually tailwind WILL NOT work for `bg-surface/20` using our current CSS variables (`#111827`).
            // To fix it, we should convert them to hex in code, OR we convert the css variables in index.html to RGB space syntax.
            // Oh right, we can fix index.html variables natively!
            
            if (content !== initialContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

processDir('./');
console.log('✅ Refactoring done');
