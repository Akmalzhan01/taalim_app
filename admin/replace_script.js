import fs from 'fs';
import path from 'path';

const searchStr1 = / с\./g;
const replaceStr1 = ' сом';
const searchStr2 = / с\b/g;
const replaceStr2 = ' сом';
const searchStr3 = / сум/gi;
const replaceStr3 = ' сом';
const searchStr4 = /\+998/g;
const replaceStr4 = '+996';

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = false;

            if (content.match(searchStr1)) { content = content.replace(searchStr1, replaceStr1); updated = true; }
            if (content.match(searchStr2)) { content = content.replace(searchStr2, replaceStr2); updated = true; }
            if (content.match(searchStr3)) { content = content.replace(searchStr3, replaceStr3); updated = true; }
            if (content.match(searchStr4)) { content = content.replace(searchStr4, replaceStr4); updated = true; }

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

walkDir('c:/Users/User/Desktop/code/project/taalim_app/admin/src');
if (fs.existsSync('c:/Users/User/Desktop/code/project/taalim_app/pos/src')) {
    walkDir('c:/Users/User/Desktop/code/project/taalim_app/pos/src');
}
console.log('Done!');
