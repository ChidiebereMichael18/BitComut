# Starts the lightweight portable PostgreSQL (no Windows service).
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/start-db.ps1
$pg   = "C:\Users\REB\pgsql"
$data = "C:\Users\REB\pgsql\data"

if (Test-Path "$data\postmaster.pid") {
  Write-Host "PostgreSQL appears to already be running (postmaster.pid present)."
} else {
  Start-Process -FilePath "$pg\bin\pg_ctl.exe" -ArgumentList "-D", "`"$data`"", "-l", "`"$data\pg.log`"", "start" -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

# Wait until it accepts connections.
& "$pg\bin\pg_isready.exe" -h 127.0.0.1 -p 5432
