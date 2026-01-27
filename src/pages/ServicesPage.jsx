import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
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
    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory);
    }
    setFilteredServices(result);
  }, [services, selectedCategory]);

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
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-gray-50/50 to-cyan-50/30 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="mb-8 md:mb-10 text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 md:mb-4"
          >
            Корисні контакти та сервіси
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-600 max-w-2xl"
          >
            Знаходьте україномовних лікарів, юристів та перевірені заклади. Підтримка рідною мовою у серці Німеччини.
          </motion.p>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2.5 md:gap-3">
            {SERVICES_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-full font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
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

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-teal-600 animate-spin mb-4" />
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
                  className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 cursor-pointer group flex flex-col h-full hover:scale-[1.01] overflow-hidden"
                >
                  {/* Header: Name + Category */}
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight flex-1 line-clamp-2 group-hover:text-teal-600 transition-colors">
                      {service.name}
                    </h3>
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 bg-teal-50 text-teal-600 text-xs font-semibold rounded-xl border border-teal-100">
                      <Icon size={13} className="text-teal-500" />
                      <span className="hidden sm:inline">{categoryLabel}</span>
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {/* Profession Badge - if exists */}
                    {service.profession && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-600 rounded-xl text-xs font-semibold border border-teal-100">
                        <span>{service.profession}</span>
                      </div>
                    )}

                    {/* Location with colored icon */}
                    {service.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="text-teal-500 flex-shrink-0" />
                        <span className="line-clamp-1">{service.address?.split(',')[0] || service.address}</span>
                      </div>
                    )}

                    {/* Author - Clickable Avatar */}
                    {(service.user_id || service.author_name) && (
                      <div className="flex items-center gap-2 text-sm">
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
                            className="flex items-center gap-2 min-w-0 group/author text-left hover:bg-teal-50/50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                          >
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0 border-2 border-teal-100 group-hover/author:border-teal-300 transition-colors"
                              />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
                                {(authorName || 'К').charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="truncate font-medium text-gray-700 group-hover/author:text-teal-600 transition-colors">
                              {authorName}
                            </span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs font-bold">
                              {(authorName || 'К').charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate text-gray-600">{authorName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description - Limited to 3 lines on mobile */}
                    {service.description && (
                      <p className="text-gray-600 leading-relaxed line-clamp-3 md:line-clamp-4 text-sm pt-1">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Languages */}
                  {Array.isArray(service.languages) && service.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                      {[...new Set(service.languages.map(normalizeLanguageCode))].map((code) => (
                        <span
                          key={code}
                          className="inline-flex items-center px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded border border-gray-200"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer: Date */}
                  <div className="pt-3 mt-3 border-t border-gray-100">
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
