const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'components', 'ComplaintDetail.tsx');
let s = fs.readFileSync(file, 'utf8');
// Remove the ChevronDown import line regardless of spacing
s = s.split('\n').filter(line => !line.trim().startsWith('ChevronDown')).join('\n');
fs.writeFileSync(file, s, 'utf8');
console.log('ChevronDown removed:', !s.includes('ChevronDown'));
