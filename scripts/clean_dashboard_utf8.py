from pathlib import Path

path = Path(r"D:\Projects\vornix-forge\app\dashboard\DashboardClient.tsx")
text = path.read_text(encoding="utf-8", errors="replace")
clean = ''.join(ch if ord(ch) < 128 else '-' for ch in text)
path.write_text(clean, encoding="utf-8", newline='\n')
print('rewritten')
