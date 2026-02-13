import { motion } from 'framer-motion';
import { 
  Home as HomeIcon, Loader2,
  Building2, Layout, Users, Warehouse, Compass
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, getHousing, getProfilesByIds } from '../lib/supabase';
import { onEvent, Events } from '../lib/events';
import HousingCard from '../components/HousingCard';
import UserProfileModal from '../components/UserProfileModal';
import GuestGuard from '../components/GuestGuard';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

const HOUSING_CATEGORIES = [
  { id: '', label: 'Всі', icon: Compass },
  { id: 'apartment', label: 'Квартири', icon: Building2 },
  { id: 'room', label: 'Кімнати (WG)', icon: Users },
  { id: 'studio', label: 'Студії', icon: Layout },
  { id: 'house', label: 'Будинки', icon: Warehouse },
];

export default function HousingPage() {
  const [housing, setHousing] = useState([]);
  const [filteredHousing, setFilteredHousing] = useState([]);
  const [authorNamesMap, setAuthorNamesMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [user, setUser] = useState(null);
  const [showGuestGuard, setShowGuestGuard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    loadHousing();
    const unsubscribe = onEvent(Events.HOUSING_ADDED, () => loadHousing());
    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [housing, selectedCategory]);

  const loadHousing = async () => {
    try {
      setLoading(true);
      const data = await getHousing();
      const list = Array.isArray(data) ? data : [];
      setHousing(list);
      const ids = list.map((h) => h.user_id).filter(Boolean);
      const map = await getProfilesByIds(ids);
      setAuthorNamesMap(map);
    } catch (e) {
      console.warn('Error loading housing:', e);
      setHousing([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...housing];
    if (selectedCategory) {
      result = result.filter(h => h.type === selectedCategory);
    }
    setFilteredHousing(result);
  };

  const getTypeLabel = (type) => {
    const labels = {
      'apartment': 'Квартира',
      'room': 'Кімната',
      'studio': 'Студія',
      'house': 'Будинок',
    };
    return labels[type] || type;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'щойно';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}хв`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}год`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}дн`;
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-gray-50/50 to-blue-50/30 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="mb-8 md:mb-10 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 md:mb-4"
          >
            Житло у Берліні
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-600 max-w-2xl"
          >
            Знаходьте затишний дім або публікуйте власні оголошення для української спільноти у столиці.
          </motion.p>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2.5 md:gap-3">
            {HOUSING_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-full font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-blue-500/20'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-gray-500'} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium italic">Шукаємо найкращі пропозиції...</p>
          </div>
        ) : filteredHousing.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] p-16 shadow-xl border border-slate-100 text-center flex flex-col items-center"
          >
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <HomeIcon size={64} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Поки що тут порожньо</h3>
            <p className="text-slate-500 max-w-md">
              В цій категорії ще немає оголошень. Станьте першим, хто запропонує житло!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHousing.map((item, index) => {
              const TypeIcon = HOUSING_CATEGORIES.find((c) => c.id === item.type)?.icon || HomeIcon;
              const profile = authorNamesMap.get(item.user_id);
              const categoryLabel = getTypeLabel(item.type);
              return (
                <HousingCard
                  key={item.id}
                  item={item}
                  index={index}
                  profile={profile}
                  categoryLabel={categoryLabel}
                  TypeIcon={TypeIcon}
                  getTypeLabel={getTypeLabel}
                  getTimeAgo={getTimeAgo}
                  onAuthorClick={(id) => {
                    if (!user) {
                      setShowGuestGuard(true);
                      return;
                    }
                    setSelectedUserId(id);
                    setShowUserModal(true);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {showUserModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
      {showGuestGuard && (
        <GuestGuard
          onClose={() => setShowGuestGuard(false)}
          onLogin={() => { setShowGuestGuard(false); setShowLoginModal(true); }}
          onRegister={() => { setShowGuestGuard(false); setShowRegisterModal(true); }}
        />
      )}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
        />
      )}
    </div>
  );
}
