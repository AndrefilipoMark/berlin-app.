import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getServices } from '../lib/supabase';
import { onEvent, Events } from '../lib/events';

const getCategoryLabel = (category) => {
  const labels = {
    medical: 'Медицина',
    food: 'Гастрономія',
    beauty: 'Beauty',
    legal: 'Юристи',
    translations: 'Переклади',
    other: 'Інше',
  };
  return labels[category] || category;
};

const normalizeLanguageCode = (lang) => {
  if (!lang) return 'EN';
  const code = String(lang).toUpperCase().trim();
  return code === 'GB' ? 'EN' : code;
};

export default function ServicesCard() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadServices();
    
    // Слухаємо події додавання нових сервісів
    const unsubscribe = onEvent(Events.SERVICE_ADDED, () => {
      loadServices();
    });
    
    return unsubscribe;
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getServices();
      const list = Array.isArray(data) ? data : [];
      setServices(list);
      setTotalCount(list.length);
    } catch (e) {
      console.warn('Error loading services:', e);
      setServices([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl border border-gray-100 transition-all duration-300 h-full overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 aspect-square flex-shrink-0 bg-teal-500/10 text-teal-600 border border-teal-500/20 rounded-2xl flex items-center justify-center shadow-sm">
              <Sparkles size={22} className="text-teal-600 animate-heartbeat" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Корисні контакти та сервіси</h2>
              <p className="text-xs text-gray-500">
                {loading ? 'Завантаження...' : `${totalCount} ${totalCount === 1 ? 'сервіс' : totalCount < 5 ? 'сервіси' : 'сервісів'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {services.length > 0 && (
              <div className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                Нові послуги
              </div>
            )}
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp size={18} className="text-teal-600" />
            </motion.div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Поки немає послуг. Будьте першим хто додасть!
            </div>
          ) : (
            services.slice(0, 2).map((service, index) => (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                onClick={() => navigate(`/services/${service.id}`)}
                className="p-4 rounded-2xl bg-white border-2 border-gray-300 hover:border-teal-400 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.01] overflow-hidden"
              >
                <div className="flex justify-between items-start gap-3 mb-1.5">
                  <h3 className="text-sm font-extrabold text-gray-900 max-w-[70%] line-clamp-2 group-hover:text-teal-600 transition-colors">
                    {service.name}
                  </h3>
                  <span className="flex-shrink-0 px-2 py-1 bg-teal-50 text-teal-600 text-[10px] font-semibold rounded border border-teal-100">
                    {getCategoryLabel(service.category)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {service.address && (
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs mb-0.5">
                      <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-1">{service.address.split(',')[0] || service.address}</span>
                    </div>
                  )}
                  {service.description && (
                    <p className="text-gray-600 text-[13px] leading-snug line-clamp-3 relative">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  {Array.isArray(service.languages) && service.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(service.languages.slice(0, 4).map(normalizeLanguageCode))].map((code) => (
                        <span
                          key={code}
                          className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}
                  {service.district && (
                    <div className="flex justify-end ml-auto">
                      <span className="flex items-center gap-1 text-gray-700 text-[10px] font-semibold">
                        <MapPin size={10} className="text-teal-500 flex-shrink-0" />
                        {service.district}
                      </span>
                    </div>
                  )}
                </div>
              </motion.article>
            ))
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate('/services');
          }}
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Завантаження...
            </>
          ) : (
            <>Всі {totalCount} {totalCount === 1 ? 'сервіс' : totalCount < 5 ? 'сервіси' : 'сервісів'} →</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
