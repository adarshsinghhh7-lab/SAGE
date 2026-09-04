const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'components', 'SubmissionForm.tsx');
let s = fs.readFileSync(file, 'utf8');

// General surface colors
s = s.replace(/bg-white\b/g, 'bg-[#E8DFC8]');
s = s.replace(/bg-slate-50/g, 'bg-[#E8DFC8]');
s = s.replace(/bg-slate-100/g, 'bg-[#E8DFC8]');
s = s.replace(/bg-indigo-50/g, 'bg-[#B08D3E]/10');
s = s.replace(/bg-emerald-50/g, 'bg-[#5B7D5B]/10');
s = s.replace(/bg-emerald-200/g, 'bg-[#5B7D5B]/20');
s = s.replace(/bg-red-50/g, 'bg-[#A6352C]/10');
s = s.replace(/bg-red-100/g, 'bg-[#A6352C]/10');
s = s.replace(/bg-amber-50/g, 'bg-[#B08D3E]/10');
s = s.replace(/bg-amber-100/g, 'bg-[#B08D3E]/10');
s = s.replace(/bg-violet-50/g, 'bg-[#5B6B8D]/10');
s = s.replace(/bg-violet-100/g, 'bg-[#5B6B8D]/10');
s = s.replace(/bg-rose-50/g, 'bg-[#A6352C]/10');
s = s.replace(/bg-rose-100/g, 'bg-[#A6352C]/10');
s = s.replace(/bg-sky-50/g, 'bg-[#5B7A8D]/10');
s = s.replace(/bg-sky-100/g, 'bg-[#5B7A8D]/10');

// Borders
s = s.replace(/border-slate-200/g, 'border-[#D9CEB5]');
s = s.replace(/border-slate-300/g, 'border-[#D9CEB5]');
s = s.replace(/border-indigo-100\/50/g, 'border-[#2A2F3E]');
s = s.replace(/border-indigo-200\/50/g, 'border-[#2A2F3E]');
s = s.replace(/border-indigo-100/g, 'border-[#2A2F3E]');
s = s.replace(/border-emerald-400/g, 'border-[#5B7D5B]');
s = s.replace(/border-emerald-800\/30/g, 'border-[#5B7D5B]/30');
s = s.replace(/border-red-200/g, 'border-[#A6352C]/40');
s = s.replace(/border-red-600/g, 'border-[#A6352C]');
s = s.replace(/border-emerald-200\/50/g, 'border-[#5B7D5B]/40');
s = s.replace(/border-amber-400/g, 'border-[#B08D3E]');
s = s.replace(/border-violet-400/g, 'border-[#5B6B8D]');
s = s.replace(/border-violet-600/g, 'border-[#5B6B8D]');
s = s.replace(/border-rose-400/g, 'border-[#A6352C]');
s = s.replace(/border-sky-400/g, 'border-[#5B7A8D]');
s = s.replace(/border-sky-200/g, 'border-[#5B7A8D]/40');

// Text colors
s = s.replace(/text-slate-900\b/g, 'text-[#14171F]');
s = s.replace(/text-slate-800/g, 'text-[#14171F]');
s = s.replace(/text-slate-700/g, 'text-[#14171F]/80');
s = s.replace(/text-slate-600/g, 'text-[#5B6472]');
s = s.replace(/text-slate-500/g, 'text-[#5B6472]');
s = s.replace(/text-slate-400/g, 'text-[#5B6472]/60');
s = s.replace(/text-indigo-600/g, 'text-[#B08D3E]');
s = s.replace(/text-indigo-700/g, 'text-[#B08D3E]');
s = s.replace(/text-indigo-500/g, 'text-[#B08D3E]');
s = s.replace(/text-emerald-600/g, 'text-[#5B7D5B]');
s = s.replace(/text-emerald-800/g, 'text-[#5B7D5B]');
s = s.replace(/text-emerald-900/g, 'text-[#5B7D5B]');
s = s.replace(/text-emerald-950/g, 'text-[#5B7D5B]');
s = s.replace(/text-red-600/g, 'text-[#A6352C]');
s = s.replace(/text-red-700/g, 'text-[#A6352C]');
s = s.replace(/text-red-800/g, 'text-[#A6352C]');
s = s.replace(/text-red-900/g, 'text-[#A6352C]');
s = s.replace(/text-red-950/g, 'text-[#A6352C]');
s = s.replace(/text-amber-600/g, 'text-[#B08D3E]');
s = s.replace(/text-amber-700/g, 'text-[#B08D3E]');
s = s.replace(/text-amber-800/g, 'text-[#B08D3E]');
s = s.replace(/text-amber-900/g, 'text-[#B08D3E]');
s = s.replace(/text-amber-950/g, 'text-[#B08D3E]');
s = s.replace(/text-violet-600/g, 'text-[#5B6B8D]');
s = s.replace(/text-violet-900/g, 'text-[#5B6B8D]');
s = s.replace(/text-violet-950/g, 'text-[#5B6B8D]');
s = s.replace(/text-rose-600/g, 'text-[#A6352C]');
s = s.replace(/text-rose-900/g, 'text-[#A6352C]');
s = s.replace(/text-sky-600/g, 'text-[#5B7A8D]');
s = s.replace(/text-sky-900/g, 'text-[#5B7A8D]');

// Button backgrounds
s = s.replace(/bg-gradient-to-r from-indigo-500 to-purple-500/g, 'bg-[#B08D3E]');
s = s.replace(/bg-gradient-to-r from-emerald-500 to-emerald-600/g, 'bg-[#5B7D5B]');
s = s.replace(/bg-gradient-to-r from-red-500 to-rose-100/g, 'bg-[#A6352C]/10');
s = s.replace(/bg-gradient-to-r from-slate-50 to-blue-50/g, 'bg-[#5B6472]/10');
s = s.replace(/bg-gradient-to-r from-amber-50 to-orange-50/g, 'bg-[#B08D3E]/10');
s = s.replace(/bg-gradient-to-r from-emerald-50 to-green-50/g, 'bg-[#5B7D5B]/10');
s = s.replace(/bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90/g, 'bg-[#B08D3E] hover:opacity-90');
s = s.replace(/bg-indigo-500/g, 'bg-[#B08D3E]');
s = s.replace(/bg-emerald-500/g, 'bg-[#5B7D5B]');
s = s.replace(/bg-emerald-600/g, 'bg-[#5B7D5B]');
s = s.replace(/bg-red-500/g, 'bg-[#A6352C]');
s = s.replace(/bg-red-600/g, 'bg-[#A6352C]');
s = s.replace(/bg-red-700/g, 'bg-[#A6352C]');
s = s.replace(/bg-slate-900/g, 'bg-[#0B0C0F]');
s = s.replace(/hover:bg-indigo-600/g, 'hover:bg-[#B08D3E]');
s = s.replace(/hover:bg-slate-800/g, 'hover:bg-[#14171F]');
s = s.replace(/hover:bg-slate-700/g, 'hover:bg-[#1E2230]');
s = s.replace(/hover:bg-indigo-50/g, 'hover:bg-[#B08D3E]/10');
s = s.replace(/hover:bg-emerald-50/g, 'hover:bg-[#5B7D5B]/10');
s = s.replace(/hover:bg-red-50/g, 'hover:bg-[#A6352C]/10');
s = s.replace(/hover:bg-indigo-50/g, 'hover:bg-[#B08D3E]/10');
s = s.replace(/hover:bg-slate-200/g, 'hover:bg-[#D9CEB5]');
s = s.replace(/hover:bg-slate-100/g, 'hover:bg-[#D9CEB5]');
s = s.replace(/hover:bg-emerald-200/g, 'hover:bg-[#5B7D5B]/20');

// Placeholders
s = s.replace(/placeholder:text-slate-400/g, 'placeholder:text-[#5B6472]/60');
s = s.replace(/placeholder:text-slate-900\/40/g, 'placeholder:text-[#5B6472]/60');

// Shadow colors
s = s.replace(/shadow-indigo-200/g, 'shadow-[#B08D3E]/20');
s = s.replace(/shadow-emerald-200/g, 'shadow-[#5B7D5B]/20');
s = s.replace(/shadow-red-200/g, 'shadow-[#A6352C]/20');
s = s.replace(/shadow-md/g, 'shadow-sm');
s = s.replace(/shadow-lg/g, 'shadow-md');
s = s.replace(/shadow-xl/g, 'shadow-lg');

fs.writeFileSync(file, s, 'utf8');
console.log('SubmissionForm colors done');