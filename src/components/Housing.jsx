import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Users, MapPin, Home as HomeIcon, Loader2, Euro } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getHousing } from '../lib/supabase';
import { onEvent, Events } from '../lib/events';

const getTypeLabel = (type) => {
  const labels = { apartment: 'Квартира', room: 'Кімната', studio: 'Студія', house: 'Будинок' };
  return labels[type] || type;
};

export default function Housing() {
  const navigate = useNavigate();
  const [housing, setHousing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadHousing();
    const unsubscribe = onEvent(Events.HOUSING_ADDED, () => loadHousing());
    return unsubscribe;
  }, []);

  const loadHousing = async () => {
    try {
      setLoading(true);
      const data = await getHousing();
      const list = Array.isArray(data) ? data.slice(0, 2) : [];
      setHousing(list);
      setTotalCount(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      console.warn('Error loading housing:', e);
      setHousing([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      whileHover={{ y: -4 }}
      className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white to-white opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 aspect-square flex-shrink-0 bg-vibrant-yellow/10 text-vibrant-yellow border border-vibrant-yellow/20 rounded-2xl flex items-center justify-center shadow-sm">
              <Home size={22} className="text-vibrant-yellow animate-heartbeat" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Житло</h2>
              <p className="text-xs text-gray-500">
                {loading ? 'Завантаження...' : `${totalCount} ${totalCount === 1 ? 'оголошення' : 'оголошень'}`}
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-100">
            🔥 Топ
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="p-3 rounded-xl bg-gray-50/50 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="flex justify-between mb-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))
          ) : housing.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Поки немає оголошень. Додайте перше!
            </div>
          ) : (
            housing.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  whileHover={{ x: -3 }}
                  onClick={() => navigate(`/housing/${listing.id}`)}
                  className="p-3 rounded-xl bg-gradient-to-br from-gray-50/50 to-white border-2 border-gray-300 hover:border-amber-400 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-amber-600 transition-colors flex-1 line-clamp-1">
                      {listing.title}
                    </h3>
                    {listing.type && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded border border-amber-100">
                        {getTypeLabel(listing.type)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-amber-500 flex-shrink-0" />
                        {listing.district || listing.address?.split(',')[0] || listing.address || '—'}
                      </span>
                      {listing.size != null && (
                        <span className="flex items-center gap-1">
                          <HomeIcon size={11} className="text-amber-500 flex-shrink-0" />
                          {listing.size} м²
                        </span>
                      )}
                      {listing.rooms != null && (
                        <span className="flex items-center gap-1">
                          <Users size={11} className="text-amber-500 flex-shrink-0" />
                          {listing.rooms} к.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-bold text-amber-600 flex-shrink-0">
                      <Euro size={11} />
                      {listing.price}/міс
                    </div>
                  </div>
                  {listing.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                </motion.div>
            ))
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          onClick={() => navigate('/housing')}
          className="w-full py-2.5 bg-gradient-to-r from-vibrant-yellow to-amber-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Завантаження...
            </>
          ) : (
            <>Всі {totalCount} {totalCount === 1 ? 'оголошення' : 'оголошень'} →</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
