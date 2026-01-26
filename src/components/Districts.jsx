import { motion } from 'framer-motion';
import { MapPin, Users, Home as HomeIcon, Briefcase, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDistrictsStats } from '../lib/supabase';

// Унікальні іконки та стилі для кожного з 12 районів Берліна
const DISTRICT_CONFIG = {
  'Mitte': { emoji: '🏛️', bgColor: 'bg-blue-100', iconColor: 'text-blue-600', hoverColor: 'hover:bg-blue-50' },
  'Friedrichshain-Kreuzberg': { emoji: '🎨', bgColor: 'bg-purple-100', iconColor: 'text-purple-600', hoverColor: 'hover:bg-purple-50' },
  'Pankow': { emoji: '🌳', bgColor: 'bg-green-100', iconColor: 'text-green-600', hoverColor: 'hover:bg-green-50' },
  'Charlottenburg-Wilmersdorf': { emoji: '👑', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600', hoverColor: 'hover:bg-yellow-50' },
  'Spandau': { emoji: '🏰', bgColor: 'bg-orange-100', iconColor: 'text-orange-600', hoverColor: 'hover:bg-orange-50' },
  'Steglitz-Zehlendorf': { emoji: '🎭', bgColor: 'bg-pink-100', iconColor: 'text-pink-600', hoverColor: 'hover:bg-pink-50' },
  'Tempelhof-Schöneberg': { emoji: '✈️', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600', hoverColor: 'hover:bg-cyan-50' },
  'Neukölln': { emoji: '🌆', bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600', hoverColor: 'hover:bg-indigo-50' },
  'Treptow-Köpenick': { emoji: '🌊', bgColor: 'bg-teal-100', iconColor: 'text-teal-600', hoverColor: 'hover:bg-teal-50' },
  'Marzahn-Hellersdorf': { emoji: '🏘️', bgColor: 'bg-red-100', iconColor: 'text-red-600', hoverColor: 'hover:bg-red-50' },
  'Lichtenberg': { emoji: '🏭', bgColor: 'bg-gray-100', iconColor: 'text-gray-600', hoverColor: 'hover:bg-gray-50' },
  'Reinickendorf': { emoji: '🌲', bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600', hoverColor: 'hover:bg-emerald-50' },
};

export default function Districts() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDistrictsStats().then((data) => {
      if (!cancelled) {
        setDistricts(Array.isArray(data) ? data : []);
      }
    }).catch(() => {
      if (!cancelled) setDistricts([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      whileHover={{ y: -4 }}
      className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-azure-blue/10 rounded-2xl flex items-center justify-center">
          <MapPin size={18} className="text-azure-blue" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Райони Берліна</h2>
          <p className="text-xs text-gray-500">Найбільше зареєстрованих та оголошень по районах</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={28} className="text-azure-blue animate-spin" />
        </div>
      ) : districts.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          Поки немає районів із зареєстрованими учасниками. Оновіть район у профілі!
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {districts.map((district, index) => {
            const config = DISTRICT_CONFIG[district.name] || {
              emoji: '📍',
              bgColor: 'bg-gray-100',
              iconColor: 'text-gray-600',
              hoverColor: 'hover:bg-gray-50'
            };
            
            return (
              <motion.div
                key={district.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.03 }}
                whileHover={{ y: -2, scale: 1.02 }}
                className={`${config.bgColor} rounded-2xl p-4 border border-gray-200 hover:border-gray-300 ${config.hoverColor} transition-all duration-300 cursor-pointer group`}
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl mb-3"
                >
                  {config.emoji}
                </motion.div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                  {district.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users size={12} className={config.iconColor} strokeWidth={2.5} />
                    <span className="font-semibold text-gray-700">{district.members} {district.members === 1 ? 'учасник' : district.members < 5 ? 'учасники' : 'учасників'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Briefcase size={12} className={config.iconColor} strokeWidth={2.5} />
                    <span className="font-semibold text-gray-700">{district.jobs} {district.jobs === 1 ? 'вакансія' : district.jobs < 5 ? 'вакансії' : 'вакансій'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <HomeIcon size={12} className={config.iconColor} strokeWidth={2.5} />
                    <span className="font-semibold text-gray-700">{district.housing} {district.housing === 1 ? 'житло' : district.housing < 5 ? 'житла' : 'житла'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Sparkles size={12} className={config.iconColor} strokeWidth={2.5} />
                    <span className="font-semibold text-gray-700">{district.services} {district.services === 1 ? 'послуга' : district.services < 5 ? 'послуги' : 'послуг'}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
