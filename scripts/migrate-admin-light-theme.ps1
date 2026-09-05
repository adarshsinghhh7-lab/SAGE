# One-off migration: dark "case-file" palette -> Soft Hearth editorial tokens.
# Ordered literal replacements (substring-safe order: composite/hover specifics first).
$ErrorActionPreference = 'Stop'

$pairs = @(
  # --- Composite layout polish ---
  ,@('rounded-lg p-5 shadow-md', 'rounded-xl p-5 shadow-soft paper-grain')
  ,@('rounded-lg p-4 sm:p-5 mb-4 shadow-md', 'rounded-xl p-4 sm:p-5 mb-4 shadow-soft')
  ,@('rounded-lg shadow-lg overflow-x-auto', 'rounded-xl shadow-lift overflow-x-auto')
  ,@('rounded-lg shadow-lg overflow-hidden', 'rounded-xl shadow-lift overflow-hidden')
  ,@('rounded-lg p-8 sm:p-10 shadow-lg', 'rounded-2xl p-8 sm:p-10 shadow-lift paper-grain')
  ,@('border-b border-[#DDD4BD] pb-6', 'border-b border-line pb-6')
  ,@('border-b border-[#DDD4BD] bg-[#EBE3D0] p-4', 'border-b border-line bg-surface p-4')

  # --- Hover / group-hover (must precede generic bg rules) ---
  ,@('group-hover:bg-[#B59340]', 'group-hover:bg-bronze')
  ,@('hover:bg-[#1D2130]', 'hover:bg-moss-deep')
  ,@('hover:bg-[#B59340]', 'hover:bg-bronze')
  ,@('hover:bg-[#DDD4BD]', 'hover:bg-surface-soft')
  ,@('hover:bg-[#EBE3D0]', 'hover:bg-surface-soft')
  ,@('hover:bg-[#A6352C]', 'hover:bg-clay-deep')
  ,@('hover:text-[#EBE3D0]', 'hover:text-surface')
  ,@('hover:text-[#68707E]', 'hover:text-ink-soft')
  ,@('hover:border-[#68707E]', 'hover:border-ink-soft')

  # --- Text on dark wells ---
  ,@('text-[#EBE3D0]/60', 'text-surface/60')
  ,@('text-[#EBE3D0]', 'text-surface')
  ,@('text-[#DDD4BD]', 'text-surface/60')

  # --- Bronze family (#B59340) ---
  ,@('bg-[#B59340]/10', 'bg-bronze-soft')
  ,@('text-[#B59340]', 'text-bronze-deep')
  ,@('border-[#B59340]', 'border-bronze')
  ,@('bg-[#B59340]', 'bg-bronze')

  # --- Clay family (#A6352C) ---
  ,@('bg-[#A6352C]/10', 'bg-clay-soft')
  ,@('text-[#A6352C]', 'text-clay-deep')
  ,@('border-[#A6352C]/40', 'border-clay/50')
  ,@('bg-[#A6352C]', 'bg-clay')

  # --- Accent family (#5B7D5B) ---
  ,@('bg-[#5B7D5B]/10', 'bg-accent/10')
  ,@('border-[#5B7D5B]/40', 'border-accent/40')
  ,@('border-[#5B7D5B]', 'border-accent')
  ,@('text-[#5B7D5B]', 'text-accent-deep')

  # --- Dark wells (#0B0C0F, #1D2130, #5B6B8D) ---
  ,@('bg-[#0B0C0F]', 'bg-ink')
  ,@('bg-[#1D2130]', 'bg-moss-deep')
  ,@('bg-[#1E2230]', 'bg-moss-deep')
  ,@('bg-[#5B6B8D]', 'bg-ink')
  ,@('border-[#5B6B8D]', 'border-ink')

  # --- Structural borders on light surface ---
  ,@('border-[#2A2F3E]/15', 'border-line')
  ,@('border-[#2A2F3E]/30', 'border-line-strong')
  ,@('border-[#2A2F3E]', 'border-line-strong')

  # --- Ink text (#151820) opacity variants first ---
  ,@('text-[#151820]/75', 'text-ink-soft')
  ,@('text-[#151820]/80', 'text-ink-soft')
  ,@('text-[#151820]/70', 'text-ink-soft')
  ,@('text-[#151820]/60', 'text-ink-soft')
  ,@('text-[#151820]/50', 'text-ink-faint')
  ,@('text-[#151820]/40', 'text-ink-faint')
  ,@('text-[#151820]', 'text-ink')

  # --- Slate text (#68707E) ---
  ,@('placeholder:text-[#68707E]/60', 'placeholder:text-ink-faint')
  ,@('text-[#68707E]/60', 'text-ink-faint')
  ,@('text-[#68707E]', 'text-ink-soft')

  # --- Line borders / dividers (#DDD4BD) & surfaces (#EBE3D0) ---
  ,@('border-[#DDD4BD]', 'border-line-strong')
  ,@('divide-[#DDD4BD]', 'divide-line-strong')
  ,@('bg-[#EBE3D0]', 'bg-surface')

  # --- Leftover shadows ---
  ,@('shadow-lg', 'shadow-lift')
  ,@('shadow-md', 'shadow-soft')

  # --- Translucent whites on cards -> soft surface ---
  ,@('bg-white/60', 'bg-surface-soft/70')
  ,@('bg-white/70', 'bg-surface')
  ,@('bg-white/40', 'bg-surface-soft/60')
)

$files = @(
  'src/components/AdminComplaintModal.tsx'
  'src/components/AdminDashboard.tsx'
  'src/components/HeadAdminDashboard.tsx'
  'src/context/ToastContext.tsx'
)

$root = 'c:\Users\adars\Desktop\SAGE'
foreach ($rel in $files) {
  $path = Join-Path $root $rel
  $content = Get-Content -Raw -LiteralPath $path
  foreach ($p in $pairs) {
    $content = [regex]::Replace($content, [regex]::Escape($p[0]), $p[1])
  }
  [System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($true)))
  Write-Host "Migrated: $rel"
}
Write-Host 'Done.'