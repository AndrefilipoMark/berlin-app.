import { motion } from 'framer-motion';
import { 
  Briefcase, Search, Loader2,
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
    loadJobs();
    const unsubscribe = onEvent(Events.JOB_ADDED, () => loadJobs());
    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchTerm, selectedCategory]);

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
    if (searchTerm) {
      result = result.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4"
          >
            Вакансії у Берліні
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl"
          >
            Знаходьте перевірену роботу або публікуйте власні пропозиції для української спільноти.
          </motion.p>
        </div>

        {/* Search & Category Chips */}
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 mb-8">
          <div className="flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Шукати вакансії..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-azure-blue focus:bg-white transition-all text-slate-900 outline-none placeholder:text-slate-400 shadow-inner"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {JOBS_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-azure-blue text-white shadow-lg shadow-blue-500/30 scale-105'
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
