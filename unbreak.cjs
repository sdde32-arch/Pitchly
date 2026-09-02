const fs = require('fs');

function unbreak(file) {
    let content = fs.readFileSync(file, 'utf8');
    // find // followed by some text, ending in a space and then typical code keywords like const, return, export, await, if
    content = content.replace(/(\/\/[^\n]*?) (export |const |let |var |return |if |await |} |{ )/g, '$1\n$2');
    content = content.replace(/}( )?export/g, '}\nexport');
    content = content.replace(/}( )?const/g, '}\nconst');
    content = content.replace(/; (export|const|let|var|return|if|await|}) /g, ';\n$1 ');
    fs.writeFileSync(file, content);
}

['utils/seedTurfs.ts', 'utils/seedAdmin.ts', 'context/BookingContext.tsx', 'context/PWAContext.tsx'].forEach(file => {
    if (fs.existsSync(file)) unbreak(file);
});
