import { motion } from 'framer-motion';
import { 
  Briefcase, Loader2,
  Cpu, Hammer, Utensils, Truck, Wrench, Stethoscope, Compass, HelpCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, getJobs, getProfilesByIds } from '../lib/supabase';
import { onEvent, Events } from '../lib/events';
import JobCard from '../components/JobCard';
import UserProfileModal from '../components/UserProfileModal';
import GuestGuard from '../components/GuestGuard';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

const JOBS_CATEGORIES = [
  { id: '', label: 'Всі', icon: Compass },
  { id: 'IT', label: 'IT', icon: Cpu },
  { id: 'Будівництво', label: 'Будівництво', icon: Hammer },
  { id: 'Гастрономія', label: 'Гастрономія', icon: Utensils },
  { id: 'Логістика', label: 'Логістика', icon: Truck },
  { id: 'Послуги', label: 'Послуги', icon: Wrench },
  { id: 'Медицина', label: 'Медицина', icon: Stethoscope },
  { id: 'Інше', label: 'Інше', icon: HelpCircle },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
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
    loadJobs();
    const unsubscribe = onEvent(Events.JOB_ADDED, () => loadJobs());
    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, selectedCategory]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      const list = Array.isArray(data) ? data : [];
      setJobs(list);
      const ids = list.map((j) => j.user_id).filter(Boolean);
      const map = await getProfilesByIds(ids);
      setAuthorNamesMap(map);
    } catch (e) {
      console.warn('Error loading jobs:', e);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...jobs];
    if (selectedCategory) {
      result = result.filter(job => job.category === selectedCategory);
    }
    setFilteredJobs(result);
  };

  const formatSalary = (min, max) => {
    if (min && max) return `€${min} - €${max}`;
    if (min) return `від €${min}`;
    if (max) return `до €${max}`;
    return 'Договірна';
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

  const getEmploymentTypeLabel = (type) => {
    const labels = {
      'full-time': 'Повна',
      'part-time': 'Часткова',
      'contract': 'Контракт',
      'internship': 'Стажування',
    };
    return labels[type] || type || '—';
  };

  const normalizeLanguageCode = (lang) => {
    if (!lang) return 'EN';
    const code = String(lang).toUpperCase().trim();
    return code === 'GB' ? 'EN' : code;
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
            Вакансії у Берліні
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-600 max-w-2xl"
          >
            Знаходьте перевірену роботу або публікуйте власні пропозиції для української спільноти.
          </motion.p>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2.5 md:gap-3">
            {JOBS_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-full font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
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
            <Loader2 size={48} className="text-azure-blue animate-spin mb-4" />
            <p className="text-slate-500 font-medium italic">Завантажуємо вакансії...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] p-16 shadow-xl border border-slate-100 text-center flex flex-col items-center"
          >
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Briefcase size={64} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Поки що тут порожньо</h3>
            <p className="text-slate-500 max-w-md">
              В цій категорії ще немає оголошень. Станьте першим, хто додасть вакансію!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, index) => {
              const CatIcon = JOBS_CATEGORIES.find((c) => c.id === job.category)?.icon || Briefcase;
              const profile = authorNamesMap.get(job.user_id);
              const categoryLabel = JOBS_CATEGORIES.find((c) => c.id === job.category)?.label || job.category || '—';
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  profile={profile}
                  categoryLabel={categoryLabel}
                  CatIcon={CatIcon}
                  formatSalary={formatSalary}
                  getEmploymentTypeLabel={getEmploymentTypeLabel}
                  getTimeAgo={getTimeAgo}
                  normalizeLanguageCode={normalizeLanguageCode}
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
