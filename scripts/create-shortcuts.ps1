$ErrorActionPreference = "Stop"

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $projectPath
if ((Split-Path -Leaf $root) -ne "Planner") {
  # If script is run from repo root
  $root = Get-Location
}

$ws = New-Object -ComObject WScript.Shell

function New-Shortcut($name, $target, $arguments, $workDir, $icon) {
  $lnkPath = Join-Path $env:USERPROFILE "Desktop\$name.lnk"
  $sc = $ws.CreateShortcut($lnkPath)
  $sc.TargetPath = $target
  $sc.Arguments = $arguments
  $sc.WorkingDirectory = $workDir
  if ($icon) { $sc.IconLocation = $icon }
  $sc.Save()
  Write-Host "Created shortcut: $lnkPath"
}

$plannerPath = $root

New-Shortcut -name "Planner (Dev)" -target "powershell.exe" -args "-NoExit -ExecutionPolicy Bypass -Command cd '$plannerPath'; npm start" -workDir $plannerPath -icon "C:\Windows\System32\shell32.dll,24"
New-Shortcut -name "Planner (Docker)" -target "powershell.exe" -args "-NoExit -ExecutionPolicy Bypass -Command cd '$plannerPath'; docker compose up -d" -workDir $plannerPath -icon "C:\Windows\System32\shell32.dll,266"
New-Shortcut -name "Planner (Docker Stop)" -target "powershell.exe" -args "-NoExit -ExecutionPolicy Bypass -Command cd '$plannerPath'; docker compose down" -workDir $plannerPath -icon "C:\Windows\System32\shell32.dll,131"

Write-Host "Done."


