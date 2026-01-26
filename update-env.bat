@echo off
chcp 65001 >nul
echo.
echo ====================================
echo    Оновлення .env файлу
echo ====================================
echo.
echo Поточний .env:
echo.
type .env
echo.
echo ====================================
echo.
echo Введіть нові значення:
echo.
set /p "URL=VITE_SUPABASE_URL = "
set /p "KEY=VITE_SUPABASE_ANON_KEY = "
echo.
echo Створюю новий .env файл...
(
echo VITE_SUPABASE_URL=%URL%
echo VITE_SUPABASE_ANON_KEY=%KEY%
) > .env
echo.
echo ✅ Готово! Файл .env оновлено.
echo.
echo Новий вміст:
type .env
echo.
echo ====================================
echo ⚠️  ВАЖЛИВО: Перезапустіть сервер!
echo    1. Ctrl + C
echo    2. npm run dev
echo ====================================
echo.
pause
