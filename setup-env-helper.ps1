# =====================================================
# Helper script для налаштування .env файлу
# =====================================================

Write-Host "🔧 Налаштування .env файлу для Supabase" -ForegroundColor Cyan
Write-Host ""

# Перевірка чи файл .env існує
if (Test-Path ".env") {
    Write-Host "✅ Файл .env знайдено" -ForegroundColor Green
    Write-Host ""
    
    # Читаємо поточний вміст
    $content = Get-Content ".env" -Raw
    
    # Перевіряємо URL
    if ($content -match "VITE_SUPABASE_URL=(.+)") {
        $url = $matches[1].Trim()
        Write-Host "📍 Поточний URL: $url" -ForegroundColor Yellow
        
        if ($url -match "^https://.+\.supabase\.co$") {
            Write-Host "   ✅ URL має правильний формат" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  URL може бути неправильним" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ VITE_SUPABASE_URL не знайдено" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Перевіряємо API Key
    if ($content -match "VITE_SUPABASE_ANON_KEY=(.+)") {
        $key = $matches[1].Trim()
        $keyPreview = $key.Substring(0, [Math]::Min(30, $key.Length))
        
        Write-Host "🔑 Поточний ключ: $keyPreview..." -ForegroundColor Yellow
        Write-Host "   Довжина ключа: $($key.Length) символів" -ForegroundColor Yellow
        
        if ($key.StartsWith("eyJ")) {
            Write-Host "   ✅ Ключ має правильний формат (JWT токен)" -ForegroundColor Green
        } elseif ($key.StartsWith("sb_publishable_")) {
            Write-Host "   ⚠️  УВАГА: Це може бути неправильний ключ!" -ForegroundColor Red
            Write-Host "   💡 Вам потрібен 'anon' або 'public' ключ, а не 'publishable'" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   Як знайти правильний ключ:" -ForegroundColor Cyan
            Write-Host "   1. Відкрийте https://supabase.com" -ForegroundColor White
            Write-Host "   2. Оберіть ваш проект" -ForegroundColor White
            Write-Host "   3. Settings → API" -ForegroundColor White
            Write-Host "   4. Знайдіть секцію 'Project API keys'" -ForegroundColor White
            Write-Host "   5. Скопіюйте ключ з назвою 'anon' або 'public'" -ForegroundColor White
            Write-Host "      (він починається з 'eyJ...' і дуже довгий)" -ForegroundColor White
        } else {
            Write-Host "   ⚠️  Незвичний формат ключа" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ VITE_SUPABASE_ANON_KEY не знайдено" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Файл .env НЕ знайдено" -ForegroundColor Red
    Write-Host ""
    Write-Host "Створюю новий файл .env..." -ForegroundColor Yellow
    
    $envContent = @"
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
"@
    
    Set-Content -Path ".env" -Value $envContent -Encoding UTF8
    Write-Host "✅ Створено файл .env" -ForegroundColor Green
    Write-Host "📝 Тепер відредагуйте його та вставте ваші ключі" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Як оновити .env файл:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Варіант 1: Через Notepad" -ForegroundColor White
Write-Host "   notepad .env" -ForegroundColor Gray
Write-Host ""
Write-Host "Варіант 2: Через VS Code" -ForegroundColor White
Write-Host "   code .env" -ForegroundColor Gray
Write-Host ""
Write-Host "Варіант 3: Через цей скрипт" -ForegroundColor White
Write-Host "   1. Введіть ваш Supabase URL:" -ForegroundColor Gray
$newUrl = Read-Host "      URL"
Write-Host "   2. Введіть ваш Supabase ANON KEY:" -ForegroundColor Gray
$newKey = Read-Host "      KEY"

if ($newUrl -and $newKey) {
    $newContent = @"
VITE_SUPABASE_URL=$newUrl
VITE_SUPABASE_ANON_KEY=$newKey
"@
    
    Set-Content -Path ".env" -Value $newContent -Encoding UTF8
    Write-Host ""
    Write-Host "✅ Файл .env оновлено!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  ВАЖЛИВО: Перезапустіть dev сервер:" -ForegroundColor Yellow
    Write-Host "   1. Ctrl + C (щоб зупинити)" -ForegroundColor White
    Write-Host "   2. npm run dev (щоб запустити заново)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⏭️  Пропущено оновлення" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
