import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  MapPin,
  Loader2,
  Compass,
  Utensils,
  Scissors,
  Scale,
  Languages,
  HelpCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, getServices, getProfilesByIds } from '../lib/supabase';
import { onEvent, Events } from '../lib/events';
import UserProfileModal from '../components/UserProfileModal';
import GuestGuard from '../components/GuestGuard';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

const SERVICES_CATEGORIES = [
  { id: '', label: 'Всі', icon: Compass },
  { id: 'medical', label: 'Медицина', icon: Stethoscope },
  { id: 'food', label: 'Гастрономія', icon: Utensils },
  { id: 'beauty', label: 'Beauty', icon: Scissors },
  { id: 'legal', label: 'Юристи', icon: Scale },
  { id: 'translations', label: 'Переклади', icon: Languages },
  { id: 'other', label: 'Інше', icon: HelpCircle },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [authorNamesMap, setAuthorNamesMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    loadServices();
    const unsub = onEvent(Events.SERVICE_ADDED, () => loadServices());
    return unsub;
  }, []);

  useEffect(() => {
    let result = [...services];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.profession?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory);
    }
    setFilteredServices(result);
  }, [services, searchTerm, selectedCategory]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getServices();
      const list = Array.isArray(data) ? data : [];
      setServices(list);
      const ids = list.map((s) => s.user_id).filter(Boolean);
      const map = await getProfilesByIds(ids);
      setAuthorNamesMap(map);
    } catch (e) {
      console.warn('Error loading services:', e);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const n = new Date();
    const s = Math.floor((n - d) / 1000);
    if (s < 60) return 'щойно';
    if (s < 3600) return `${Math.floor(s / 60)}хв`;
    if (s < 86400) return `${Math.floor(s / 3600)}год`;
    if (s < 604800) return `${Math.floor(s / 86400)}дн`;
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  };

  const getCategoryLabel = (catId) =>
    SERVICES_CATEGORIES.find((c) => c.id === catId)?.label || catId;

  const normalizeLanguageCode = (lang) => {
    if (!lang) return 'EN';
    const code = String(lang).toUpperCase().trim();
    return code === 'GB' ? 'EN' : code;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4"
          >
            Корисні контакти та сервіси
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl"
          >
            Знаходьте україномовних лікарів, юристів та перевірені заклади. Підтримка рідною мовою у серці Німеччини.
          </motion.p>
        </div>

        {/* Search & Category Chips */}
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 mb-8">
          <div className="flex flex-col gap-6">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Шукати за назвою, професією або описом..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-purple-600 focus:bg-white transition-all text-slate-900 outline-none placeholder:text-slate-400 shadow-inner"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {SERVICES_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon size={16} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results bar */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">
            Знайдено: {loading ? '...' : filteredServices.length}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-purple-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium italic">Завантажуємо послуги...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] p-16 shadow-xl border border-slate-100 text-center flex flex-col items-center"
          >
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Compass size={64} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Поки що тут порожньо</h3>
            <p className="text-slate-500 max-w-md">
              Спеціалістів у цій категорії ще немає. Станьте першим, хто порекомендує сервіс!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => {
              const Icon =
                SERVICES_CATEGORIES.find((c) => c.id === service.category)?.icon || Stethoscope;
              const profile = authorNamesMap.get(service.user_id);
              const authorName = profile?.full_name ?? service.author_name ?? 'Користувач';
              const categoryLabel = getCategoryLabel(service.category);
              return (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/services/${service.id}`)}
                  className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer group flex flex-col h-full hover:scale-[1.01] overflow-hidden"
                >
                  {/* Назва + категорія: flex, без накладання */}
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <h3 className="text-xl font-extrabold text-gray-900 leading-tight max-w-[70%] line-clamp-2 group-hover:text-violet-600 transition-colors">
                      {service.name}
                    </h3>
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded-xl border border-purple-100">
                      <Icon size={14} className="text-purple-500" />
                      {categoryLabel}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {service.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{service.address?.split(',')[0] || service.address}</span>
                      </div>
                    )}
                    {(service.user_id || service.author_name) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {service.user_id ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) {
                                setShowGuestGuard(true);
                                return;
                              }
                              setSelectedUserId(service.user_id);
                              setShowUserModal(true);
                            }}
                            className="flex items-center gap-2 min-w-0 group/author text-left"
                          >
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                {(authorName || 'К').charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="truncate font-medium group-hover/author:text-blue-600 group-hover/author:underline transition-colors">
                              {authorName}
                            </span>
                          </button>
                        ) : (
                          <>
                            <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs font-bold">
                              {(authorName || 'К').charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate">{authorName}</span>
                          </>
                        )}
                      </div>
                    )}

                    {service.description && (
                      <p className="text-gray-600 leading-relaxed line-clamp-4 text-sm pt-1">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Мови — тільки код: UA, RU, DE, EN, без дублікатів */}
                  {Array.isArray(service.languages) && service.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {[...new Set(service.languages.map(normalizeLanguageCode))].map((code) => (
                        <span
                          key={code}
                          className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {formatDate(service.updated_at || service.created_at)}
                    </span>
                  </div>
                </motion.article>
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
