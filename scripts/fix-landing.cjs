const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'components', 'LandingPage.tsx');
let s = fs.readFileSync(file, 'utf8');

// Hero background
s = s.replace(/linear-gradient\(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%\)/g, 'linear-gradient(135deg, #14171F 0%, #1E2230 50%, #0B0C0F 100%)');

// Text colors
s = s.replace(/text-white\/90/g, 'text-[#E8DFC8]/90');
s = s.replace(/text-white\b/g, 'text-[#E8DFC8]');

// Card backgrounds
s = s.replace(/bg-white\/15/g, 'bg-[#1E2230]');
s = s.replace(/bg-white\/10/g, 'bg-[#1E2230]');

// Borders
s = s.replace(/border-white\/20/g, 'border-[#2A2F3E]');
s = s.replace(/border-white\/15/g, 'border-[#2A2F3E]');

// Buttons
s = s.replace(/bg-indigo-600/g, 'bg-[#B08D3E]');
s = s.replace(/hover:text-indigo-700/g, 'hover:text-[#14171F]');
s = s.replace(/hover:bg-white\/25/g, 'hover:bg-[#D9CEB5]');
s = s.replace(/border-white\/30/g, 'border-[#D9CEB5]');

// Icon colors
s = s.replace(/text-emerald-300/g, 'text-[#5B7D5B]');
s = s.replace(/text-cyan-300/g, 'text-[#B08D3E]');
s = s.replace(/text-amber-300/g, 'text-[#B08D3E]');
s = s.replace(/text-indigo-600/g, 'text-[#B08D3E]');

// Section backgrounds
s = s.replace(/border-indigo-100\/50/g, 'border-[#2A2F3E]');
s = s.replace(/linear-gradient\(180deg, rgba\(255,255,255,0\.9\) 0%, rgba\(240,240,255,0\.5\) 100%\)/g, 'linear-gradient(180deg, #E8DFC8 0%, #D9CEB5 100%)');

// Class names on outer container - text-slate-900
s = s.replace(/text-slate-900\b/g, 'text-[#E8DFC8]');
s = s.replace(/text-slate-600/g, 'text-[#5B6472]');
s = s.replace(/text-slate-900\/70/g, 'text-[#5B6472]');
s = s.replace(/text-slate-900\/80/g, 'text-[#14171F]/80');
s = s.replace(/text-slate-900\/60/g, 'text-[#5B6472]');
s = s.replace(/text-slate-500/g, 'text-[#5B6472]');
s = s.replace(/text-indigo-600/g, 'text-[#B08D3E]');

fs.writeFileSync(file, s, 'utf8');
console.log('LandingPage color pass 1 done');