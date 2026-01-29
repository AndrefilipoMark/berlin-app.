import { motion } from 'framer-motion';
import { Sparkles, Briefcase, Building2, MessageCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getUserStats } from '../lib/supabase';

const navItems = [
  { path: '/jobs', label: 'Вакансії', icon: Briefcase, color: 'azure-blue' },
  { path: '/housing', label: 'Житло', icon: Building2, color: 'vibrant-yellow' },
  { path: '/services', label: 'Послуги', icon: Sparkles, color: 'teal' },
  { path: '/forum', label: 'Форум', icon: MessageCircle, color: 'green' },
  { path: '/chat', label: 'Чат', icon: MessageSquare, color: 'azure-blue' },
];

export default function HeroCard() {
  const [userStats, setUserStats] = useState({ totalUsers: 0, onlineUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load stats
    const loadStats = async () => {
      try {
        setLoading(true);
        const stats = await getUserStats();
        setUserStats({
          totalUsers: stats.totalUsers || 0,
          onlineUsers: stats.onlineUsers || 0,
        });
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-100 transition-all duration-300 overflow-hidden h-auto flex flex-col"
      >
        {/* Ukrainian accent stripe at the top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-azure-blue via-vibrant-yellow to-azure-blue"></div>

        <div className="relative z-10 flex flex-col">
          {/* Title and Description - Centered */}
          <div className="flex flex-col items-center justify-center text-center mb-4 md:mb-5">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-4 leading-tight tracking-tight bg-gradient-to-r from-azure-blue via-azure-blue to-vibrant-yellow bg-clip-text text-transparent">
              Наш дім Берлін
            </h1>
            
            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 font-normal max-w-3xl leading-relaxed mb-3 md:mb-4 px-2">
              Наш дім Берлін — твоя надійна опора у великому місті. Знаходь роботу або пропонуй свою, обирай перевірених лікарів та рідні сервіси, шукай затишне житло та будь завжди на зв'язку через форум і чат. Ми об'єднали все необхідне, щоб кожен українець у Берліні почувався як вдома. Разом ми — сила! 🇺🇦
            </p>

            {/* Stats line - Under description */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gray-50 border border-gray-200 rounded-full mb-3 md:mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-gentle-pulse"></span>
                {loading ? '...' : userStats.onlineUsers.toLocaleString('uk-UA')} онлайн
              </span>
              <span className="w-0.5 h-0.5 bg-gray-400 rounded-full"></span>
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">
                {loading ? '...' : (100 + (userStats.totalUsers || 0)).toLocaleString('uk-UA')} учасники спільноти
              </span>
            </div>
          </div>

          {/* Navigation Grid - Unified with main card */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === navItems.length - 1; // Chat is last
              const getColorClasses = (color) => {
                const colors = {
                  'azure-blue': 'bg-azure-blue/10 text-azure-blue border-azure-blue/20',
                  'vibrant-yellow': 'bg-vibrant-yellow/10 text-vibrant-yellow border-vibrant-yellow/20',
                  'purple': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                  'teal': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
                  'green': 'bg-green-500/10 text-green-600 border-green-500/20'
                };
                return colors[color] || colors['azure-blue'];
              };

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group ${isLast ? 'col-span-2 md:col-span-1' : ''}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center justify-center p-2.5 md:p-3 lg:p-4 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all ${getColorClasses(item.color)}`}
                  >
                    <div className={`w-9 h-9 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-1 md:mb-1.5 ${getColorClasses(item.color)}`}>
                      <Icon size={18} className="md:w-5 md:h-5 lg:w-6 lg:h-6 animate-heartbeat group-hover:animate-breathing transition-transform" strokeWidth={2} />
                    </div>
                    <p className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-semibold text-gray-900 text-center leading-tight">
                      {item.label}
                    </p>
                  </motion.div>
                </Link>
              );
            })}
          </div>

        </div>
      </motion.div>
    </>
  );
}
