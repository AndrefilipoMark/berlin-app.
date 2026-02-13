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
      className="relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-30" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 aspect-square flex-shrink-0 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center shadow-sm">
              <Home size={22} className="text-primary animate-heartbeat" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Житло</h2>
              <p className="text-xs text-gray-500">
                {loading ? 'Завантаження...' : `${totalCount} ${totalCount === 1 ? 'оголошення' : 'оголошень'}`}
              </p>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-900 bg-accent px-2.5 py-1 rounded-full border border-yellow-400/50 shadow-sm uppercase tracking-wide flex items-center gap-1">
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
                  className="p-3 rounded-xl bg-white border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors flex-1 line-clamp-1">
                      {listing.title}
                    </h3>
                    {listing.type && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded border border-gray-200">
                        {getTypeLabel(listing.type)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 text-gray-500 flex-wrap">
                      {listing.address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-primary/70 flex-shrink-0" />
                          {listing.address.split(',')[0] || listing.address}
                        </span>
                      )}
                      {listing.size != null && (
                        <span className="flex items-center gap-1">
                          <HomeIcon size={11} className="text-primary/70 flex-shrink-0" />
                          {listing.size} м²
                        </span>
                      )}
                      {listing.rooms != null && (
                        <span className="flex items-center gap-1">
                          <Users size={11} className="text-primary/70 flex-shrink-0" />
                          {listing.rooms} к.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-bold text-primary flex-shrink-0">
                      <Euro size={11} />
                      {listing.price}/міс
                    </div>
                  </div>
                  {listing.description && (
                    <p className="text-[13px] text-gray-600 leading-snug line-clamp-3">
                      {listing.description}
                    </p>
                  )}
                  {listing.district && (
                    <div className="flex justify-end mt-1">
                      <span className="flex items-center gap-1 text-gray-700 text-[10px] font-semibold">
                        <MapPin size={10} className="text-primary/70 flex-shrink-0" />
                        {listing.district}
                      </span>
                    </div>
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
          className="w-full py-2.5 bg-accent text-gray-900 text-sm font-bold rounded-xl hover:bg-yellow-500 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
