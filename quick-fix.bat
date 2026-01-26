@echo off
chcp 65001 >nul
cls
echo.
echo ═══════════════════════════════════════════════════════
echo    ШВИДКЕ ВИПРАВЛЕННЯ .env
echo ═══════════════════════════════════════════════════════
echo.
echo Поточний ключ:
powershell -Command "$key = (Get-Content .env | Select-String 'VITE_SUPABASE_ANON_KEY').ToString().Split('=')[1].Trim(); Write-Host $key.Substring(0, [Math]::Min(50, $key.Length)) -NoNewline; Write-Host '...'; Write-Host ''; Write-Host 'Довжина:' $key.Length 'символів'; if ($key.Length -lt 50) { Write-Host 'ПРОБЛЕМА: Ключ занадто короткий!' -ForegroundColor Red } else { Write-Host 'OK: Ключ виглядає повним' -ForegroundColor Green }"
echo.
echo ───────────────────────────────────────────────────────
echo.
echo 1. Перейдіть в Supabase Dashboard
echo 2. Settings → API → Publishable key
echo 3. Натисніть кнопку [📋 Copy] ПРАВОРУЧ від ключа
echo 4. Вставте ПОВНИЙ ключ нижче:
echo.
set /p "KEY=Publishable Key: "
echo.
echo Створюю .env файл...
(
echo VITE_SUPABASE_URL=https://vlujifpvoqahbzvsgopa.supabase.co
echo VITE_SUPABASE_ANON_KEY=%KEY%
) > .env
echo.
echo ═══════════════════════════════════════════════════════
echo    ПЕРЕВІРКА
echo ═══════════════════════════════════════════════════════
echo.
powershell -Command "$key = (Get-Content .env | Select-String 'VITE_SUPABASE_ANON_KEY').ToString().Split('=')[1].Trim(); Write-Host 'Новий ключ:' $key.Substring(0, [Math]::Min(50, $key.Length)) -NoNewline; Write-Host '...'; Write-Host 'Довжина:' $key.Length 'символів'; if ($key.Length -gt 50) { Write-Host ''; Write-Host '✅ ЧУДОВО! Ключ виглядає повним!' -ForegroundColor Green } else { Write-Host ''; Write-Host '❌ Все ще занадто короткий! Спробуйте ще раз.' -ForegroundColor Red }"
echo.
echo ═══════════════════════════════════════════════════════
echo    ⚠️  НЕ ЗАБУДЬТЕ:
echo ═══════════════════════════════════════════════════════
echo.
echo    1. Ctrl + C (зупинити dev server)
echo    2. npm run dev (запустити заново)
echo.
echo ═══════════════════════════════════════════════════════
pause
