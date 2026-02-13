import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Briefcase, MapPin, Euro, Clock, Building2, Mail, Phone, Globe,
  Trash2, Edit2, X, Cpu, Hammer, Utensils, Truck, Wrench, Stethoscope, HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { getJobById, deleteJob, updateJob, supabase, getProfilesByIds } from '../lib/supabase';
import UserProfileModal from '../components/UserProfileModal';
import GuestGuard from '../components/GuestGuard';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import { emitEvent, Events } from '../lib/events';

const JOB_CATEGORIES = [
  { id: 'IT', label: 'IT', icon: Cpu },
  { id: 'Будівництво', label: 'Будівництво', icon: Hammer },
  { id: 'Гастрономія', label: 'Гастрономія', icon: Utensils },
  { id: 'Логістика', label: 'Логістика', icon: Truck },
  { id: 'Послуги', label: 'Послуги', icon: Wrench },
  { id: 'Медицина', label: 'Медицина', icon: Stethoscope },
  { id: 'Інше', label: 'Інше', icon: HelpCircle },
];

const JOB_CATEGORY_LABELS = {
  IT: 'IT',
  'Будівництво': 'Будівництво',
  'Гастрономія': 'Гастрономія',
  Логістика: 'Логістика',
  Послуги: 'Послуги',
  Медицина: 'Медицина',
  Інше: 'Інше',
};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGuestGuard, setShowGuestGuard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadJob();
  }, [id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle().then(({ data }) => setProfile(data));
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        setProfile(data);
      }
    } catch (e) {
      console.warn('Error checking auth:', e);
    }
  };

  const loadJob = async () => {
    try {
      setLoading(true);
      const data = await getJobById(id);
      setJob(data);
      if (data?.user_id) {
        const map = await getProfilesByIds([data.user_id]);
        setAuthorProfile(map.get(data.user_id) ?? null);
      } else {
        setAuthorProfile(null);
      }
    } catch (error) {
      console.error('Error loading job:', error);
      setJob(null);
      setAuthorProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'щойно';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} хвилин тому`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} годин тому`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} днів тому`;
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatSalary = (min, max) => {
    if (min && max) return `€${min} – €${max}`;
    if (min) return `від €${min}`;
    if (max) return `до €${max}`;
    return 'Договірна';
  };

  const getEmploymentTypeLabel = (type) => {
    const labels = {
      'full-time': 'Повна зайнятість',
      'part-time': 'Часткова зайнятість',
      contract: 'Контракт',
      internship: 'Стажування',
    };
    return labels[type] || type || '—';
  };

  const normalizeLanguageCode = (lang) => {
    if (!lang) return 'EN';
    const code = String(lang).toUpperCase().trim();
    return code === 'GB' ? 'EN' : code;
  };

  const getCategoryIcon = (categoryId) => {
    if (!categoryId) return Briefcase;
    // Перевіряємо точну відповідність
    const category = JOB_CATEGORIES.find((c) => c.id === categoryId);
    if (category) return category.icon;
    // Якщо не знайдено, перевіряємо без урахування регістру та пробілів
    const normalizedId = String(categoryId).trim();
    const categoryNormalized = JOB_CATEGORIES.find((c) => 
      String(c.id).trim().toLowerCase() === normalizedId.toLowerCase()
    );
    return categoryNormalized?.icon || Briefcase;
  };

  const handleDeleteJob = async () => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю вакансію? Цю дію неможливо скасувати.')) return;
    try {
      await deleteJob(job.id);
      alert('Вакансію успішно видалено!');
      emitEvent(Events.JOB_ADDED);
      emitEvent(Events.JOB_DELETED);
      navigate('/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Помилка при видаленні вакансії. Спробуйте ще раз.');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center">
            <div className="w-16 h-16 bg-azure-blue/10 rounded-full animate-pulse mx-auto mb-4" />
            <p className="text-gray-500">Завантаження...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center">
            <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Вакансію не знайдено</h2>
            <button
              onClick={() => navigate('/jobs')}
              className="px-6 py-3 bg-azure-blue text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Повернутися до списку
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CategoryIcon = job?.category ? getCategoryIcon(job.category) : Briefcase;
  const isOwner = user?.id === job?.user_id;
  const isAdmin = profile?.is_admin === true;
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-[900px] mx-auto"
      >
        {/* Back */}
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-gray-600 hover:text-azure-blue font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Назад до вакансій</span>
        </motion.button>

        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
          {/* Header */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 break-words leading-tight">
                  {job.title}
                </h1>
                {job.company && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building2 size={18} className="text-azure-blue" />
                    <span className="font-semibold">{job.company}</span>
                  </div>
                )}
                {job.category && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-azure-blue/10 text-azure-blue rounded-lg text-sm font-bold">
                      <CategoryIcon size={16} />
                      {JOB_CATEGORY_LABELS[job.category] ?? job.category}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {canEdit && (
                  <button
                    onClick={() => setEditingJob(job)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-azure-blue/10 text-azure-blue rounded-xl hover:bg-azure-blue/20 transition-colors font-semibold text-xs md:text-sm whitespace-nowrap"
                  >
                    <Edit2 size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Редагувати</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeleteJob}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold text-xs md:text-sm shadow-md hover:shadow-lg border-2 border-red-600 whitespace-nowrap"
                  >
                    <Trash2 size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Видалити</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Euro size={18} className="text-azure-blue" />
                <div>
                  <p className="text-xs text-gray-500">Зарплата</p>
                  <p className="font-bold text-gray-900">{formatSalary(job.salary_min, job.salary_max)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <MapPin size={18} className="text-azure-blue" />
                <div>
                  <p className="text-xs text-gray-500">Локація</p>
                  <p className="font-bold text-gray-900">{job.location || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Clock size={18} className="text-azure-blue" />
                <div>
                  <p className="text-xs text-gray-500">Зайнятість</p>
                  <p className="font-bold text-gray-900">{getEmploymentTypeLabel(job.employment_type)}</p>
                </div>
              </div>
            </div>

            {/* Автор публікації — тільки якщо не власник */}
            {job.user_id && !isOwner && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) { setShowGuestGuard(true); return; }
                      setSelectedUserId(job.user_id);
                      setShowUserModal(true);
                    }}
                    className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-azure-blue/5 transition-colors text-left group"
                  >
                    {authorProfile?.avatar_url ? (
                      <img
                        src={authorProfile.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-azure-blue to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                        {(authorProfile?.full_name || job.author_name || 'К').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Опублікував</p>
                      <p className="font-semibold text-gray-900 group-hover:text-azure-blue transition-colors">
                        {authorProfile?.full_name || job.author_name || 'Користувач'}
                      </p>
                    </div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { setShowGuestGuard(true); return; }
                    navigate(`/messages/${job.user_id}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-azure-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <MessageSquare size={18} />
                  <span>Написати автору</span>
                </button>
              </div>
            )}
          </div>

          {/* Languages */}
          {job.languages && job.languages.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={18} className="text-gray-400" />
                <h3 className="font-bold text-gray-900">Мови</h3>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {job.languages.map((lang, idx) => {
                  const code = normalizeLanguageCode(lang);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-semibold text-gray-600"
                    >
                      {code}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Опис вакансії</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {job.description || '—'}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <h3 className="font-bold text-amber-900 mb-2">Вимоги до кандидата</h3>
              <p className="text-amber-800 leading-relaxed whitespace-pre-line">{job.requirements}</p>
            </div>
          )}

          {/* Contact */}
          {(job.contact_email || job.contact_phone || job.website) && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Контактна інформація</h3>
              <div className="space-y-3">
                {job.contact_email && (
                  <a
                    href={`mailto:${job.contact_email}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-azure-blue hover:bg-azure-blue/5 transition-all group"
                  >
                    <Mail size={20} className="text-slate-500 group-hover:text-azure-blue" />
                    <span className="text-slate-700 font-medium group-hover:text-azure-blue">
                      {job.contact_email}
                    </span>
                  </a>
                )}
                {job.contact_phone && (
                  <a
                    href={`tel:${job.contact_phone}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-azure-blue hover:bg-azure-blue/5 transition-all group"
                  >
                    <Phone size={20} className="text-slate-500 group-hover:text-azure-blue" />
                    <span className="text-slate-700 font-medium group-hover:text-azure-blue">
                      {job.contact_phone}
                    </span>
                  </a>
                )}
                {job.website && (
                  <a
                    href={job.website.startsWith('http') ? job.website : `https://${job.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-azure-blue hover:bg-azure-blue/5 transition-all group"
                  >
                    <Globe size={20} className="text-slate-500 group-hover:text-azure-blue" />
                    <span className="text-slate-700 font-medium group-hover:text-azure-blue">
                      {job.website}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>Опубліковано {getTimeAgo(job.created_at)}</span>
            {job.user_id && (
              <span className="text-xs">ID: {String(job.user_id).slice(0, 8)}…</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit modal */}
      {editingJob &&
        createPortal(
          <EditJobModal
            job={editingJob}
            onClose={() => setEditingJob(null)}
            onSuccess={async (updated) => {
              setJob(updated);
              setEditingJob(null);
              await loadJob();
              emitEvent(Events.JOB_ADDED);
            }}
          />,
          document.body
        )}

      {showUserModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => { setShowUserModal(false); setSelectedUserId(null); }}
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

function EditJobModal({ job, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: job?.title || '',
    category: job?.category || 'IT',
    description: job?.description || '',
    salary_min: job?.salary_min?.toString() || '',
    salary_max: job?.salary_max?.toString() || '',
    location: job?.location || '',
    employment_type: job?.employment_type || 'full-time',
    languages: Array.isArray(job?.languages) ? job.languages : [],
    requirements: job?.requirements || '',
    contact_email: job?.contact_email || '',
    contact_phone: job?.contact_phone || '',
    website: job?.website || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.location || !formData.description) {
      alert('Будь ласка, заповніть усі обов\'язкові поля (*)');
      return;
    }
    if (!user?.id) {
      alert('Потрібна авторизація');
      return;
    }
    try {
      setSubmitting(true);
      const jobData = {
        title: formData.title.trim(),
        company: '',
        category: formData.category || null,
        description: formData.description.trim(),
        salary_min: formData.salary_min ? parseInt(formData.salary_min, 10) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max, 10) : null,
        location: formData.location.trim(),
        employment_type: formData.employment_type || 'full-time',
        languages: Array.isArray(formData.languages) ? formData.languages : [],
        requirements: formData.requirements?.trim() || null,
        contact_email: formData.contact_email?.trim() || null,
        contact_phone: formData.contact_phone?.trim() || null,
        website: formData.website?.trim() || null,
      };
      const updated = await updateJob(job.id, jobData);
      alert('Вакансію успішно оновлено!');
      onSuccess(updated);
    } catch (error) {
      console.error('Error updating job:', error);
      alert(`Помилка при оновленні вакансії.\n\n${error.message || 'Невідома помилка'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[32px] p-8 md:p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-azure-blue to-blue-600 rounded-2xl flex items-center justify-center">
                <Briefcase size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Редагувати вакансію</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Назва вакансії *</label>
              <input
                type="text"
                placeholder="Frontend Developer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Категорія *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
              >
                <option value="IT">IT</option>
                <option value="Будівництво">Будівництво</option>
                <option value="Гастрономія">Гастрономія</option>
                <option value="Логістика">Логістика</option>
                <option value="Послуги">Послуги</option>
                <option value="Медицина">Медицина</option>
                <option value="Інше">Інше</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Зарплата від (€)</label>
                <input
                  type="number"
                  placeholder="3000"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Зарплата до (€)</label>
                <input
                  type="number"
                  placeholder="4500"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Локація *</label>
              <input
                type="text"
                placeholder="Mitte, Berlin"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Тип зайнятості *</label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
              >
                <option value="full-time">Повна зайнятість</option>
                <option value="part-time">Часткова зайнятість</option>
                <option value="contract">Контракт</option>
                <option value="internship">Стажування</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Опис вакансії *</label>
              <textarea
                placeholder="Детальний опис вакансії..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Вимоги</label>
              <textarea
                placeholder="Список вимог до кандидата..."
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Мови</label>
              <div className="flex gap-2 flex-wrap">
                {['UA', 'RU', 'DE', 'EN'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      const langs = formData.languages || [];
                      if (langs.includes(lang)) {
                        setFormData({ ...formData, languages: langs.filter((l) => l !== lang) });
                      } else {
                        setFormData({ ...formData, languages: [...langs, lang] });
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      formData.languages?.includes(lang)
                        ? 'bg-azure-blue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Email для контакту</label>
              <input
                type="email"
                placeholder="hr@company.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Телефон для контакту</label>
              <input
                type="tel"
                placeholder="+49 30 123 4567"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Веб-сайт</label>
              <input
                type="url"
                placeholder="https://company.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Скасувати
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-azure-blue to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Збереження…' : 'Зберегти зміни'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
