import { motion } from 'framer-motion';
import { MapPin, Users, Home as HomeIcon, Briefcase, BookOpen, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDistrictsStats } from '../lib/supabase';

// Унікальні іконки та стилі для кожного з 12 районів Берліна
const DISTRICT_CONFIG = {
  'Mitte': { emoji: '🏛️', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Friedrichshain-Kreuzberg': { emoji: '🎨', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Pankow': { emoji: '🌳', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Charlottenburg-Wilmersdorf': { emoji: '👑', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Spandau': { emoji: '🏰', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Steglitz-Zehlendorf': { emoji: '🎭', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Tempelhof-Schöneberg': { emoji: '✈️', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Neukölln': { emoji: '🌆', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Treptow-Köpenick': { emoji: '🌊', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Marzahn-Hellersdorf': { emoji: '🏘️', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Lichtenberg': { emoji: '🏭', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
  'Reinickendorf': { emoji: '🌲', bgColor: 'bg-white', iconColor: 'text-primary', hoverColor: 'hover:border-primary/50' },
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
      className="relative bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
          <MapPin size={18} className="text-primary" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Райони Берліна</h2>
          <p className="text-xs text-gray-500">Найбільше зареєстрованих та оголошень по районах</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={28} className="text-primary animate-spin" />
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
              bgColor: 'bg-white',
              iconColor: 'text-gray-600',
              hoverColor: 'hover:border-gray-300'
            };
            
            return (
              <motion.div
                key={district.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.03 }}
                whileHover={{ y: -2, scale: 1.02 }}
                className={`${config.bgColor} rounded-2xl p-4 border border-gray-100 ${config.hoverColor} transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md`}
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl mb-3"
                >
                  {config.emoji}
                </motion.div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
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
                    <BookOpen size={12} className={config.iconColor} strokeWidth={2.5} />
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
