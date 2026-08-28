# Stops the lightweight portable PostgreSQL.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/stop-db.ps1
$pg   = "C:\Users\REB\pgsql"
$data = "C:\Users\REB\pgsql\data"

if (Test-Path "$data\postmaster.pid") {
  & "$pg\bin\pg_ctl.exe" -D $data stop -m fast
} else {
  Write-Host "PostgreSQL is not running."
}
