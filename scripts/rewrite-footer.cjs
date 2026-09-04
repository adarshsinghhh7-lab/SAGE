const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'App.tsx');
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const i = s.indexOf('{/* Footer */}');
const j = s.indexOf('</footer>');
if (i < 0 || j < 0) { console.error('markers not found'); process.exit(1); }

const newFooter = `      {/* Footer */}
      <footer className="border-t border-[#2A2F3E] bg-[#1E2230] py-8 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#E8DFC8]/70">
            <strong className="text-[#B08D3E]">S.A.G.E.</strong> — Student Anonymous Grievance & Escalation System
          </p>
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-[#5B6472] flex-wrap justify-center">
            <button type="button" onClick={() => { setCurrentView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#B08D3E] underline cursor-pointer">How It Works & FAQ</button>
            <span>·</span>
            <button type="button" onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#B08D3E] underline cursor-pointer">Administrative Portal</button>
            <span>·</span>
            <button type="button" onClick={handleResetToDefaultSeed} className="hover:text-[#B08D3E] underline cursor-pointer">Reset Seed Ledger</button>
            <span>·</span>
            <span className="text-[#5B7D5B] font-bold">100% Cryptographic Anonymity</span>
          </div>
        </div>
      </footer>`;

s = s.slice(0, i) + newFooter + s.slice(j + '</footer>'.length);
fs.writeFileSync(file, s.replace(/\n/g, '\r\n'), 'utf8');
console.log('App.tsx footer OK, len', s.length);
