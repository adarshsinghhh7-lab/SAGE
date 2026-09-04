const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'components', 'RevealIdentityModal.tsx');
let src = fs.readFileSync(file, 'utf8');

const successBlockOld = `          {revealResult ? (
            <>
              {/* Success / Revealed identity — local state only, not persisted */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <p className="text-xs font-mono font-bold text-emerald-800">
                  Decryption Successful · Immutable Audit Record: {revealResult.logId}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-red-900/70 mb-1">
                  Decrypted Submitter Reference
                </p>
                <p className="text-sm font-mono font-bold text-red-900 break-words">
                  {revealResult.decryptedIdentity}
                </p>
                <p className="mt-1 text-[10px] font-mono text-slate-500">
                  Displayed only on this screen. Never stored or cached on the client.
                </p>
              </div>

              <p className="text-[10px] font-mono text-slate-500">
                Timestamp: {revealResult.timestamp} · Stored in{' '}
                <span className="font-bold">revealLogs</span> (update/delete forbidden).
              </p>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 text-white font-mono text-xs font-bold uppercase hover:bg-slate-800 cursor-pointer rounded-lg"
                >
                  Close
                </button>
              </div>
              </motion.div>
            </>
          ) : isRevealing ? (`;

const successBlockNew = `          {revealResult ? (
            <>
              {/* Success — the ONE bold animation in the entire app. The redaction
                  bar literally wipes away via clip-path, revealing the identity
                  underneath over ~550ms with a slow, weighty ease. Nowhere else
                  uses this. */}
              <div className="bg-[#5B7D5B]/10 border border-[#5B7D5B]/40 p-3 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5B7D5B] shrink-0" />
                  <p className="text-xs font-mono font-bold text-[#5B7D5B]">
                    Decryption Successful · Immutable Audit Record: {revealResult.logId}
                  </p>
                </div>
              </div>

              <div className="relative bg-[#0B0C0F] border border-[#2A2F3E] p-4 mb-3 overflow-hidden">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#E8DFC8]/50 mb-1">
                  Decrypted Submitter Reference
                </p>

                <div className="relative">
                  <p className="text-sm font-mono font-bold text-[#E8DFC8] break-words">
                    {revealResult.decryptedIdentity}
                  </p>
                  {/* Redaction bar wiping away left-to-right via clip-path */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                    animate={{ clipPath: didUnmask ? 'inset(0% 0% 0% 100%)' : 'inset(0% 0% 0% 0%)' }}
                    transition={{ duration: 0.55, ease: [0.45, 0, 0.35, 1] }}
                    onAnimationComplete={() => setDidUnmask(true)}
                  >
                    <div className="h-full w-full bg-[#A6352C] flex items-center justify-center">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#E8DFC8]/70">
                        REDACTED
                      </span>
                    </div>
                  </motion.div>
                </div>

                <p className="mt-1 text-[10px] font-mono text-[#E8DFC8]/40">
                  Displayed only on this screen. Never stored or cached on the client.
                </p>
              </div>

              <p className="text-[10px] font-mono text-[#5B6472]">
                Timestamp: {revealResult.timestamp} · Stored in{' '}
                <span className="font-bold text-[#14171F]">revealLogs</span> (update/delete forbidden).
              </p>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#0B0C0F] text-[#E8DFC8] font-mono text-xs font-bold uppercase hover:bg-[#14171F] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          ) : isRevealing ? (`;

if (!src.includes(successBlockOld)) {
  console.error('SUCCESS BLOCK OLD NOT FOUND');
  process.exit(1);
}
src = src.replace(successBlockOld, successBlockNew);
fs.writeFileSync(file, src, 'utf8');
console.log('RevealIdentityModal success block rewritten OK. Length:', src.length);

