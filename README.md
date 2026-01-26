# 🇺🇦 Наші в Берліні

Modern Bento Grid дизайн для української спільноти в Берліні.

![Status](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1.18-cyan)

## 🎨 Дизайн

### Кольорова палітра
- **Background**: `#F5F5F7` (Soft Sand)
- **Cards**: Білі картки з `rounded-3xl` (24px)
- **Azure Blue**: `#0057B7` - основний акцент (вакансії)
- **Vibrant Yellow**: `#FFD700` - додатковий акцент (житло)
- **Шрифт**: Inter (Google Fonts)

### Компоненти

#### 🏛️ Hero Card (3 колонки)
Великий героїчний блок з:
- Пульсуючим синім індикатором "Online"
- Заголовком "Наші в Берліні"
- Статистикою: 2,500+ учасників, 150+ активних сьогодні

#### 💼 Jobs - Вакансії (2 колонки)
- 45+ активних позицій
- 3 останні вакансії з деталями
- Фільтри по районах та типу роботи
- Зарплати та терміни публікації

#### 🏠 Housing - Житло (2 колонки)
- 32 оголошення про оренду
- Квартири, кімнати, WG
- Ціни, площа, кількість мешканців
- Дати доступності

#### 🗺️ Districts - Райони (1 колонка, висока)
Вертикальна колонка з 4 районами:
1. **Mitte** 🏛️ - 520 учасників, 12 оголошень
2. **Neukölln** 🎨 - 380 учасників, 18 оголошень
3. **Kreuzberg** 🌆 - 445 учасників, 15 оголошень
4. **Prenzlauer Berg** 🌳 - 290 учасників, 9 оголошень

#### 📡 Community Pulse (4 колонки - повна ширина)
Live Feed з:
- Реальними питаннями від спільноти
- Trending позначками 🔥
- Автоматичною ротацією контенту (кожні 5 сек)
- Лічильником відповідей та часом публікації

## 🚀 Технології

- **React** 19.2.0 - UI фреймворк
- **Vite** 7.2.4 - швидкий білдер
- **Tailwind CSS** 4.1.18 - утилітарні стилі (з PostCSS)
- **Framer Motion** - плавні анімації
- **Lucide React** - красиві іконки

## ⚙️ Конфігурація

Проект використовує:
- `tailwind.config.js` - конфігурація Tailwind з кастомними кольорами
- `postcss.config.js` - обробка CSS
- `src/index.css` - базові Tailwind директиви (@tailwind base/components/utilities)

## 📦 Встановлення

```bash
# Клонування репозиторію
git clone <your-repo-url>
cd Berlin-APP

# Встановлення залежностей
npm install

# Запуск dev сервера
npm run dev

# Білд для продакшену
npm run build

# Попередній перегляд білду
npm run preview
```

## 🎯 Особливості

✨ **Анімації**
- Плавні fade-in ефекти при завантаженні з затримкою
- `hover:scale-[1.02]` на всіх картках - "живий" ефект
- Пульсуючий індикатор онлайн статусу
- Автоматична ротація Community Feed (5 секунд)
- Rotate анімації на іконках

🎨 **Справжній 4-колонковий Bento Grid**
```
Desktop (md+):
┌─────────────┬──┐
│ Hero (3col) │D │ ← Districts (1col, висока)
├──────┬──────┤i │
│Jobs  │House │s │
│(2col)│(2col)│t │
├──────┴──────┴──┤
│Community (4col) │ ← Повна ширина
└─────────────────┘

Mobile:
Всі картки в 1 колонку ↓
```

- Grid: `grid-cols-1 md:grid-cols-4`
- Hero Card: `md:col-span-3`
- Districts: `md:col-span-1 md:row-span-2`
- Jobs: `md:col-span-2`
- Housing: `md:col-span-2`
- Community Pulse: `md:col-span-4`

📱 **Респонсивний дизайн**
- Мобільна адаптація (320px+)
- Планшети (768px+)
- Десктоп (1024px+)
- Широкі екрани (1600px max-width)

♿ **Доступність**
- Семантична HTML розмітка
- Keyboard navigation
- ARIA labels
- Focus states

## 📱 Структура проекту

```
Berlin-APP/
├── src/
│   ├── components/
│   │   ├── HeroCard.jsx       (Hero блок, 3 колонки)
│   │   ├── Jobs.jsx           (Вакансії, 2 колонки)
│   │   ├── Housing.jsx        (Житло, 2 колонки)
│   │   ├── Districts.jsx      (Райони, 1 колонка висока)
│   │   └── CommunityPulse.jsx (Live Feed, 4 колонки)
│   ├── App.jsx                (4-колонковий Bento Grid)
│   ├── main.jsx               (Entry point)
│   └── index.css              (Tailwind v4 + кастомні кольори)
├── tailwind.config.js         (Конфігурація + safelist)
├── postcss.config.js          (@tailwindcss/postcss)
├── index.html                 (Inter font)
├── package.json
└── vite.config.js
```

## 🎨 Кастомізація

Всі кольори та теми можна змінити в `src/index.css`:

```css
@theme {
  --color-azure-blue: #0057B7;
  --color-vibrant-yellow: #FFD700;
  --color-soft-sand: #F5F5F7;
}
```

## 📄 Ліцензія

Створено з 💙💛 для української спільноти в Берліні

---

Made with ❤️ using Sonnet 4.5
