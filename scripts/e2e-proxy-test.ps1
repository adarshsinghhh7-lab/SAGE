$ErrorActionPreference = 'Stop'
$root = 'c:\Users\adars\Desktop\SAGE'

# 1) Start the backend (plain node, single process, easy to stop)
$be = Start-Process -FilePath node `
  -ArgumentList 'src/server.js' `
  -WorkingDirectory "$root\backend" `
  -RedirectStandardOutput "$root\e2e-be.log" `
  -RedirectStandardError "$root\e2e-be-err.log" `
  -PassThru
Write-Host "backend pid=$($be.Id)" -ForegroundColor Cyan

$ready = $false
for ($i = 0; $i -lt 45; $i++) {
  Start-Sleep -Milliseconds 1000
  try { $null = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 3; $ready = $true; break } catch {}
}
if (-not $ready) {
  Write-Host 'backend failed to start' -ForegroundColor Red
  Get-Content "$root\e2e-be-err.log" -ErrorAction SilentlyContinue | Select-Object -First 20
} else {
  Write-Host 'backend UP (direct :5000)' -ForegroundColor Green
}

# 2) Proxy check: the user's Vite on :3000 forwards /api -> :5000
$proxied = $false
try {
  $h = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -TimeoutSec 5
  Write-Host "PROXIED health via :3000 -> $($h.firebase.status)" -ForegroundColor Green
  $proxied = $true
} catch {
  Write-Host "PROXY NOT ACTIVE: $($_.Exception.Message)" -ForegroundColor Red
  Get-Content "$root\e2e-be-err.log" -ErrorAction SilentlyContinue | Select-Object -First 10
}

# 3) Submit a complaint through the browser's exact path (:3000/api/...)
$headers = @{
  'Content-Type' = 'application/json'
  'x-sage-role'  = 'student'
  'x-sage-uid'   = 'proxy_e2e_uid_xyz'
  'x-sage-voter-id' = 'proxyhash'
}
$body = @{
  category       = 'electricity'
  hostelOrLocation = 'Aryabhatta Block'
  location       = 'Aryabhatta Block'
  description    = 'Flickering tube light in room 214 near the washbasin; appears loose from the holder.'
  photoUrl       = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
  videoUrl       = 'data:video/mp4;base64,AAAAIGZ0eXBpc29t'
} | ConvertTo-Json

if ($proxied) {
  try {
    $r = Invoke-RestMethod -Uri 'http://localhost:3000/api/complaints' -Method Post -Headers $headers -Body $body -TimeoutSec 20
    Write-Host "PROXIED POST OK: $($r.data.complaintId) video-saved=$([bool]$r.data.videoUrl) sealed=$($r.data.encryptedUserRef.Length -gt 0)" -ForegroundColor Green
  } catch {
    Write-Host "PROXIED POST failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# 4) Backend down -> proxy must return a non-JSON 500 (frontend maps this to the actionable message)
Stop-Process -Id $be.Id -Force -ErrorAction SilentlyContinue
Wait-Process -Id $be.Id -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 800
try {
  $null = Invoke-RestMethod -Uri 'http://localhost:3000/api/complaints' -Method Post -Headers $headers -Body $body -TimeoutSec 20
  Write-Host 'UNEXPECTED: POST succeeded with backend down' -ForegroundColor Red
} catch {
  $resp = $_.Exception.Response
  $status = if ($resp) { [int]$resp.StatusCode } else { 'no-HTTP-response' }
  $bodyText = [string]$_.ErrorDetails.Message
  $head = if ($bodyText) { $bodyText.Substring(0, [Math]::Min(80, $bodyText.Length)) } else { '(no body)' }
  Write-Host "POST with backend down -> HTTP $status ; body-head: $head" -ForegroundColor Yellow
}

Remove-Item "$root\e2e-be.log", "$root\e2e-be-err.log" -ErrorAction SilentlyContinue
Write-Host 'DONE - your Vite on :3000 was left untouched' -ForegroundColor Cyan