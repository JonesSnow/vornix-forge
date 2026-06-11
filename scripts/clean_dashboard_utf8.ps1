$path = 'D:\Projects\vornix-forge\app\dashboard\DashboardClient.tsx'
$content = Get-Content $path -Raw
$content = [regex]::Replace($content, '[^\u0000-\u007F]', '-')
Set-Content -Path $path -Value $content -Encoding utf8
Write-Output 'rewritten'
