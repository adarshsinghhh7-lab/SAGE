const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'components', 'RevealIdentityModal.tsx');
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('{revealResult ? (');
const end = src.indexOf(') : isRevealing ? (');
if (start < 0 || end < 0) { console.log('markers not found'); process.exit(1); }
console.log(JSON.stringify(src.slice(start, end + 20)));


