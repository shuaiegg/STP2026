import fs from 'fs';
import { globSync } from 'glob';

const CJK_REGEX = /[\u4e00-\u9fa5]/;
const TARGET_DIRS = [
    'src/app/(protected)/dashboard',
    'src/components/dashboard'
];
const EXCLUDE_PATTERNS = [
    '/admin/',
    '.test.',
    '.spec.'
];

function checkFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (CJK_REGEX.test(content)) {
        const lines = content.split('\n');
        const violations = lines
            .map((line, idx) => ({ line, lineNum: idx + 1 }))
            .filter(({ line }) => CJK_REGEX.test(line))
            // Exclude lines that are likely comments
            .filter(({ line }) => !line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.trim().startsWith('*'));
        
        return violations;
    }
    return [];
}

let totalViolations = 0;

TARGET_DIRS.forEach(dir => {
    const files = globSync(`${dir}/**/*.{ts,tsx}`);
    files.forEach(file => {
        if (EXCLUDE_PATTERNS.some(p => file.includes(p))) return;
        
        const violations = checkFile(file);
        if (violations.length > 0) {
            console.log(`\nViolation in ${file}:`);
            violations.forEach(({ line, lineNum }) => {
                console.log(`  L${lineNum}: ${line.trim()}`);
                totalViolations++;
            });
        }
    });
});

if (totalViolations > 0) {
    console.log(`\nTotal violations: ${totalViolations}`);
    // process.exit(1); // Set to 1 when ready for CI
} else {
    console.log('No CJK characters found in target directories.');
}
