import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import ContactAdmin from './ContactAdmin';

export default function Footer() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isChatPage = location.pathname.startsWith('/chat');
  const isMessagesPage = location.pathname.startsWith('/messages');
  
  if (isChatPage || isMessagesPage) return null;

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-12 pb-8"
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        {isHomePage && (
          <div className="bg-white rounded-[28px] p-6 md:p-8 lg:p-10 border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
            {/* Декоративна смуга */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-90" />

            {/* Про наш сайт — стримано, одним текстом */}
            <div className="mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Про наш сайт</h3>
              <p className="text-gray-600 leading-relaxed max-w-3xl">
                Платформа для українців у Берліні: знаходьте кафе, лікарів, послуги, спілкуйтеся у форумі та чаті, шукайте вакансії та житло.
              </p>
            </div>

            {/* Бета-блок — преміальний вигляд */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 md:p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent/20 text-gray-900 text-xs font-bold uppercase tracking-wide">
                    Beta
                  </span>
                  <span className="text-sm font-semibold text-gray-900">Сайт в бета-тестуванні</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Деякі функції можуть працювати некоректно. Знайшли помилку чи маєте ідеї? Допоможіть нам стати краще.
                </p>
              </div>
              <div className="flex-shrink-0">
                <ContactAdmin asButton={true} linkText="Написати адміну" />
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6">
              <span>Сайт створений однією людиною для тисяч українців</span>
              <Heart size={16} className="text-red-500 fill-red-500" />
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="mt-6 text-center">
          <div className="inline-block px-6 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <p className="font-medium text-gray-500 text-sm mb-2">
              Наш дім Берлін © 2026 • Створено з 💙💛 для української спільноти
            </p>
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              <Link
                to="/impressum"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                Impressum
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                Політика конфіденційності
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/terms"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                Умови використання
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
