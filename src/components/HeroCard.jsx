import { motion } from 'framer-motion';
import { Sparkles, Briefcase, Home, MessageCircle, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUserStats } from '../lib/supabase';

export default function HeroCard() {
  const [userStats, setUserStats] = useState({ totalUsers: 0, onlineUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="relative bg-white/90 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full"
    >
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-azure-blue/5 to-blue-50 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Online Indicator */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-4 h-4 bg-azure-blue rounded-full relative"
          >
            <motion.div
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-azure-blue rounded-full"
            />
          </motion.div>
          <span className="text-azure-blue font-semibold text-sm uppercase tracking-wide">
            Online
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight bg-clip-text">
          Наш дім Берлін
        </h1>
        
        <p className="text-lg md:text-xl text-gray-700 font-semibold mb-6 max-w-2xl">
          Ваша платформа для життя в Берліні
        </p>

        {/* Features List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Сервіси українською мовою</p>
              <p className="text-xs text-gray-500">Лікарі, ресторани, салони краси та інші послуги</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-azure-blue/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Briefcase size={16} className="text-azure-blue" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Робота та житло</p>
              <p className="text-xs text-gray-500">Знаходьте вакансії та житло в Берліні</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageCircle size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Форум</p>
              <p className="text-xs text-gray-500">Задавайте питання та дізнавайтеся про події</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Чат</p>
              <p className="text-xs text-gray-500">Спілкуйтесь з усією українською спільнотою</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 md:gap-8 mt-8">
          <div className="bg-azure-blue/5 px-4 py-3 rounded-2xl border border-azure-blue/10">
            <div className="text-3xl md:text-4xl font-extrabold text-azure-blue">
              {loading ? '...' : (100 + (userStats.totalUsers || 0)).toLocaleString('uk-UA')}
            </div>
            <div className="text-xs text-gray-500 mt-1">Учасників</div>
          </div>
          <div className="bg-vibrant-yellow/5 px-4 py-3 rounded-2xl border border-vibrant-yellow/10">
            <div className="text-3xl md:text-4xl font-extrabold text-vibrant-yellow">
              {loading ? '...' : userStats.onlineUsers.toLocaleString('uk-UA')}
            </div>
            <div className="text-xs text-gray-500 mt-1">Онлайн зараз</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
