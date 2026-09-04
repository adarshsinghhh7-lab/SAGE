const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'src', 'components');
const cx = path.join(__dirname, '..', 'src', 'context');
const app = path.join(__dirname, '..', 'src', 'App.tsx');

const fixes = [
  ['hover:bg-indigo-700', 'hover:bg-[#B08D3E]'],
  ['border-emerald-700', 'border-[#5B7D5B]'],
  ['text-indigo-800', 'text-[#B08D3E]'],
  ['bg-violet-700', 'bg-[#5B6B8D]'],
  ['border-violet-500', 'border-[#5B6B8D]'],
  ['border-indigo-600', 'border-[#B08D3E]'],
  ['focus:border-indigo-400', 'focus:border-[#B08D3E]'],
  ['hover:bg-red-700', 'hover:bg-[#A6352C]'],
  ['border-red-700', 'border-[#A6352C]'],
  ['bg-indigo-50/30', 'bg-[#B08D3E]/10'],
  ['bg-indigo-600', 'bg-[#B08D3E]'],
  ['hover:bg-indigo-100', 'hover:bg-[#B08D3E]/15'],
  ['border-amber-700', 'border-[#B08D3E]'],
  ['bg-amber-600', 'bg-[#B08D3E]'],
  ['bg-emerald-50', 'bg-[#5B7D5B]/10'],
  ['border-emerald-200', 'border-[#5B7D5B]/40'],
  ['text-emerald-900', 'text-[#5B7D5B]'],
  ['bg-red-50', 'bg-[#A6352C]/10'],
  ['border-red-200', 'border-[#A6352C]/40'],
  ['text-red-900', 'text-[#A6352C]'],
  ['bg-slate-900', 'bg-[#0B0C0F]'],
  ['text-slate-50', 'text-[#E8DFC8]'],
  ['border-slate-900', 'border-[#2A2F3E]'],
  ['hover:bg-slate-800', 'hover:bg-[#1E2230]'],
];

const files = [
  path.join(src, 'AdminDashboard.tsx'),
  path.join(src, 'HeadAdminDashboard.tsx'),
  path.join(src, 'LandingPage.tsx'),
  path.join(src, 'SubmissionForm.tsx'),
  path.join(cx, 'ToastContext.tsx'),
  app,
];

let count = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [a, b] of fixes) {
    while (s.includes(a)) { s = s.replace(a, b); count++; }
  }
  fs.writeFileSync(f, s, 'utf8');
}
console.log('Fixed', count, 'remaining old-color refs');
