// =====================================================
// Перевірка налаштувань Supabase
// =====================================================
// Цей скрипт перевіряє, чи правильно налаштовані змінні середовища

console.log('🔍 Перевірка налаштувань Supabase...\n');

// Перевірка наявності змінних
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('1. Перевірка файлу .env:');
console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Встановлено' : '❌ Відсутній');
console.log('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Встановлено' : '❌ Відсутній');

if (supabaseUrl) {
  console.log('\n2. Перевірка URL:');
  console.log('   URL:', supabaseUrl);
  
  if (supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')) {
    console.log('   ✅ URL виглядає правильно');
  } else {
    console.log('   ⚠️  URL може бути неправильним. Очікується формат: https://xxx.supabase.co');
  }
}

if (supabaseAnonKey) {
  console.log('\n3. Перевірка API Key:');
  console.log('   Довжина ключа:', supabaseAnonKey.length, 'символів');
  
  if (supabaseAnonKey.length > 100) {
    console.log('   ✅ Довжина ключа виглядає правильно');
  } else {
    console.log('   ⚠️  Ключ може бути неповним');
  }
}

console.log('\n4. Перевірка підключення до Supabase:');
if (supabaseUrl && supabaseAnonKey) {
  console.log('   ⏳ Спроба підключення...');
  
  import('../src/lib/supabase.js').then(({ supabase }) => {
    supabase
      .from('jobs')
      .select('count')
      .then(({ data, error }) => {
        if (error) {
          console.log('   ❌ Помилка підключення:', error.message);
          console.log('\n💡 Можливі причини:');
          console.log('   - Неправильний URL або API Key');
          console.log('   - RLS політики блокують доступ');
          console.log('   - Таблиця jobs не створена');
        } else {
          console.log('   ✅ Підключення успішне!');
          console.log('   📊 Знайдено записів у таблиці jobs:', data.length);
        }
      });
  }).catch((err) => {
    console.log('   ❌ Помилка імпорту:', err.message);
  });
} else {
  console.log('   ⏭️  Пропущено (відсутні URL або API Key)');
}

console.log('\n' + '='.repeat(50));
console.log('💡 Якщо виникли проблеми:');
console.log('   1. Перевірте файл .env в корені проекту');
console.log('   2. Переконайтесь, що імена змінних правильні:');
console.log('      - VITE_SUPABASE_URL');
console.log('      - VITE_SUPABASE_ANON_KEY');
console.log('   3. Перезапустіть сервер після зміни .env');
console.log('   4. Див. ІНСТРУКЦІЯ_ВИПРАВЛЕННЯ_ПОМИЛКИ.md');
console.log('='.repeat(50));
