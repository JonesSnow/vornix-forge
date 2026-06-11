$path = 'D:\Projects\vornix-forge\app\dashboard\DashboardClient.tsx'
$bytes = [System.IO.File]::ReadAllBytes($path)
$count = ($bytes | Where-Object { $_ -gt 127 }).Count
Write-Output "non_ascii=$count"
