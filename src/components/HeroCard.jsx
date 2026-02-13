import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getUserStats } from '../lib/supabase';

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
        className="relative bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] border border-gray-100/50 transition-all duration-300 overflow-hidden h-auto flex flex-col"
      >
        {/* Subtle background glow effects */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col">
          {/* Title and Description - Centered */}
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 md:mb-8 leading-tight tracking-tight drop-shadow-sm">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0057B7] to-[#0077e6]">Наш дім</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#F59E0B]">Берлін</span>
            </h1>
            
            {/* Description */}
            <div className="max-w-3xl mx-auto mb-8 md:mb-12">
              <p className="text-base sm:text-lg md:text-xl text-gray-500 font-medium leading-normal md:leading-relaxed px-4">
                Простір підтримки та можливостей. Тут ви можете легко <span className="text-gray-900 font-semibold">знайти роботу</span>, <span className="text-gray-900 font-semibold">орендувати житло</span> чи скористатися <span className="text-gray-900 font-semibold">послугами своїх</span>.
              </p>
              <p className="text-base sm:text-lg md:text-xl text-gray-500 font-medium leading-normal md:leading-relaxed px-4 mt-2">
                Спілкуйтеся на <span className="text-gray-900 font-semibold">форумі</span>, знаходьте друзів у <span className="text-gray-900 font-semibold">чаті</span> та відчувайте себе як вдома. 🇺🇦
              </p>
            </div>

            {/* Stats line - Minimalist Pill */}
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-white border border-gray-100 rounded-full shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-default">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {loading ? '...' : userStats.onlineUsers.toLocaleString('uk-UA')} <span className="font-medium text-gray-400">онлайн</span>
                </span>
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">
                  {loading ? '...' : (100 + (userStats.totalUsers || 0)).toLocaleString('uk-UA')} <span className="font-medium text-gray-400">у спільноті</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
