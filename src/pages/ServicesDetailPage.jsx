import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Stethoscope, MapPin, Phone, Mail, Globe, X, Edit2, Trash2, Utensils, Scissors, Scale, Languages, Compass, HelpCircle } from 'lucide-react';
import { getServiceById, deleteService, updateService, supabase } from '../lib/supabase';
import { emitEvent, Events } from '../lib/events';
import { MEDICINE_PROFESSIONS, GASTRONOMY_SUBCATEGORIES, BEAUTY_SUBCATEGORIES } from '../lib/constants';

const SERVICES_CATEGORIES = [
  { id: '', label: 'Всі', icon: Compass },
  { id: 'medical', label: 'Медицина', icon: Stethoscope },
  { id: 'food', label: 'Гастрономія', icon: Utensils },
  { id: 'beauty', label: 'Beauty', icon: Scissors },
  { id: 'legal', label: 'Юристи', icon: Scale },
  { id: 'translations', label: 'Переклади', icon: Languages },
  { id: 'other', label: 'Інше', icon: HelpCircle },
];

export default function ServicesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    checkAuth();
    loadService();
  }, [id]);

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

  const loadService = async () => {
    try {
      setLoading(true);
      const data = await getServiceById(id);
      setService(data);
    } catch (error) {
      console.error('Error loading service:', error);
      setService(null);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (catId) =>
    SERVICES_CATEGORIES.find((c) => c.id === catId)?.label || catId;

  const getCategoryIcon = (catId) => {
    const category = SERVICES_CATEGORIES.find((c) => c.id === catId);
    return category?.icon || Stethoscope;
  };

  // Нормалізація коду мови: GB -> EN
  const normalizeLanguageCode = (lang) => {
    if (!lang) return 'EN';
    const code = String(lang).toUpperCase().trim();
    return code === 'GB' ? 'EN' : code;
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

  const handleDeleteService = async () => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей сервіс? Цю дію неможливо скасувати.')) {
      return;
    }

    try {
      await deleteService(service.id);
      alert('Сервіс успішно видалено!');
      emitEvent(Events.SERVICE_ADDED);
      emitEvent(Events.SERVICE_DELETED);
      navigate('/services');
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Помилка при видаленні сервісу. Спробуйте ще раз.');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center">
            <div className="w-16 h-16 bg-teal-600/10 rounded-full animate-pulse mx-auto mb-4" />
            <p className="text-gray-500">Завантаження...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center">
            <Stethoscope size={48} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Сервіс не знайдено</h2>
            <button
              onClick={() => navigate('/services')}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Повернутися до списку
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(service.category);
  const isOwner = user?.id === service?.user_id;
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
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => navigate('/services')}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-600 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Назад до послуг</span>
        </motion.button>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
          {/* Header */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 break-words leading-tight">
                  {service.name}
                </h1>
                <div className="flex items-center gap-3 text-gray-600">
                  <CategoryIcon size={18} className="text-teal-600" />
                  <span className="font-semibold">{getCategoryLabel(service.category)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {canEdit && (
                  <button
                    onClick={() => setEditingService(service)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-600/10 text-teal-600 rounded-xl hover:bg-teal-600/20 transition-colors font-semibold text-xs md:text-sm whitespace-nowrap"
                  >
                    <Edit2 size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Редагувати</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeleteService}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold text-xs md:text-sm shadow-md hover:shadow-lg border-2 border-red-600 whitespace-nowrap"
                  >
                    <Trash2 size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Видалити</span>
                  </button>
                )}
              </div>
            </div>

            {/* Address */}
            {service.address && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <MapPin size={18} className="text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Адреса</p>
                  <p className="font-bold text-gray-900">{service.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Languages */}
          {service.languages && service.languages.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={18} className="text-gray-400" />
                <h3 className="font-bold text-gray-900">Мови</h3>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {Array.isArray(service.languages) ? service.languages.map((lang, idx) => {
                  const code = normalizeLanguageCode(lang);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-semibold text-gray-600"
                    >
                      {code}
                    </span>
                  );
                }) : (
                  (() => {
                    const code = normalizeLanguageCode(service.languages);
                    return (
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-semibold text-gray-600">
                        {code}
                      </span>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {service.description && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Опис</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>
          )}

          {/* Contact */}
          {(service.phone || service.email || service.website) && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Контактна інформація</h3>
              <div className="space-y-3">
                {service.phone && (
                  <a
                    href={`tel:${service.phone}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-600/5 transition-all group"
                  >
                    <Phone size={20} className="text-slate-500 group-hover:text-teal-600" />
                    <span className="text-slate-700 font-medium group-hover:text-teal-600">
                      {service.phone}
                    </span>
                  </a>
                )}
                {service.email && (
                  <a
                    href={`mailto:${service.email}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-600/5 transition-all group"
                  >
                    <Mail size={20} className="text-slate-500 group-hover:text-teal-600" />
                    <span className="text-slate-700 font-medium group-hover:text-teal-600">
                      {service.email}
                    </span>
                  </a>
                )}
                {service.website && (
                  <a
                    href={service.website.startsWith('http') ? service.website : `https://${service.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-600/5 transition-all group"
                  >
                    <Globe size={20} className="text-slate-500 group-hover:text-teal-600" />
                    <span className="text-slate-700 font-medium group-hover:text-teal-600">
                      {service.website}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>Опубліковано {getTimeAgo(service.created_at)}</span>
            {service.user_id && (
              <span className="text-xs">ID: {service.user_id.slice(0, 8)}...</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit Service Modal */}
      {editingService && createPortal(
        <EditServiceModal 
          service={editingService}
          onClose={() => setEditingService(null)}
          onSuccess={async (updatedData) => {
            if (updatedData) {
              setService(updatedData);
            }
            setEditingService(null);
            await new Promise(resolve => setTimeout(resolve, 300));
            await loadService();
            emitEvent(Events.SERVICE_ADDED);
          }}
        />,
        document.body
      )}
    </div>
  );
}

// Edit Service Modal Component
function EditServiceModal({ service, onClose, onSuccess }) {
  const [formData, setFormData] = useState(() => {
    const initialData = {
      name: service?.name || '',
      category: service?.category || 'medical',
      profession: service?.profession || '',
      description: service?.description || '',
      address: service?.address || '',
      phone: service?.phone || '',
      email: service?.email || '',
      website: service?.website || '',
      languages: Array.isArray(service?.languages) ? service.languages : [],
    };
    console.log('[EditServiceModal] Ініціалізація formData з service:', service);
    console.log('[EditServiceModal] Початкові дані форми:', initialData);
    return initialData;
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log('[EditServiceModal] handleSubmit викликано, formData:', formData);
    
    if (!formData.name || !formData.category || !formData.address) {
      alert('Будь ласка, заповніть усі обов\'язкові поля (*)');
      return;
    }

    try {
      setSubmitting(true);

      const serviceData = {
        name: formData.name.trim(),
        profession: ['medical', 'food', 'beauty'].includes(formData.category) && formData.profession ? formData.profession.trim() : null,
        category: formData.category || 'medical',
        description: formData.description?.trim() || null,
        address: formData.address.trim(),
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        website: formData.website?.trim() || null,
        languages: Array.isArray(formData.languages) && formData.languages.length > 0 ? formData.languages : [],
      };

      console.log('[EditServiceModal] Відправка оновлення...', { id: service.id, serviceData });
      console.log('[EditServiceModal] Повний об\'єкт serviceData:', JSON.stringify(serviceData, null, 2));
      
      if (!serviceData.name || !serviceData.address) {
        console.error('[EditServiceModal] Помилка: serviceData порожній або некоректний:', serviceData);
        alert('Помилка: дані форми некоректні. Спробуйте ще раз.');
        setSubmitting(false);
        return;
      }
      
      const updated = await updateService(service.id, serviceData);
      console.log('[EditServiceModal] Оновлено:', updated);
      
      if (!updated) {
        console.error('[EditServiceModal] Помилка: оновлені дані не отримано');
        alert('Помилка при оновленні. Спробуйте ще раз.');
        setSubmitting(false);
        return;
      }
      
      alert('Сервіс успішно оновлено!');
      onSuccess(updated);
    } catch (error) {
      console.error('Error updating service:', error);
      alert(`Помилка при оновленні сервісу:\n\n${error.message || 'Невідома помилка'}`);
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
              <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl flex items-center justify-center">
                <Stethoscope size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Редагувати сервіс</h2>
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
              <label className="block text-sm font-bold text-gray-900 mb-2">Назва *</label>
              <input
                type="text"
                placeholder="Dr. Schmidt"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Категорія *</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  const hasSubcat = ['medical', 'food', 'beauty'].includes(cat);
                  setFormData({
                    ...formData,
                    category: cat,
                    profession: hasSubcat ? formData.profession : '',
                  });
                }}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
              >
                <option value="medical">Медицина</option>
                <option value="food">Гастрономія</option>
                <option value="beauty">Beauty</option>
                <option value="legal">Юристи</option>
                <option value="translations">Переклади</option>
                <option value="other">Інше</option>
              </select>
            </div>

            {formData.category === 'medical' && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Спеціалізація лікаря</label>
                <div className="flex flex-wrap gap-2">
                  {MEDICINE_PROFESSIONS.map((p) => {
                    const isActive = formData.profession === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, profession: isActive ? '' : p.id })}
                        className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-teal-100 hover:border-teal-200 hover:bg-teal-50/50'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {formData.category === 'food' && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Тип закладу</label>
                <div className="flex flex-wrap gap-2">
                  {GASTRONOMY_SUBCATEGORIES.map((p) => {
                    const isActive = formData.profession === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, profession: isActive ? '' : p.id })}
                        className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-teal-100 hover:border-teal-200 hover:bg-teal-50/50'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {formData.category === 'beauty' && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Тип послуги</label>
                <div className="flex flex-wrap gap-2">
                  {BEAUTY_SUBCATEGORIES.map((p) => {
                    const isActive = formData.profession === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, profession: isActive ? '' : p.id })}
                        className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-teal-100 hover:border-teal-200 hover:bg-teal-50/50'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Адреса *</label>
              <input
                type="text"
                placeholder="Prenzlauer Berg, Kastanienallee 12"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Опис</label>
              <textarea
                placeholder="Додаткова інформація..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Мови</label>
              <div className="flex gap-2">
                {['UA', 'RU', 'DE', 'EN'].map(lang => {
                  const currentLangs = Array.isArray(formData.languages) ? formData.languages : [];
                  const isSelected = currentLangs.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        const langs = Array.isArray(formData.languages) ? formData.languages : [];
                        if (langs.includes(lang)) {
                          setFormData({ ...formData, languages: langs.filter(l => l !== lang) });
                        } else {
                          setFormData({ ...formData, languages: [...langs, lang] });
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Телефон</label>
              <input
                type="tel"
                placeholder="+49 30 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
              <input
                type="email"
                placeholder="info@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Веб-сайт</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Збереження...' : 'Зберегти зміни'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
