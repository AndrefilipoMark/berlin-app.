import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Home as HomeIcon, MapPin, Euro, Maximize, Users, Mail, Phone, Globe, Building2, Layout, Warehouse, X, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { getHousingById, deleteHousing, updateHousing, supabase, getProfilesByIds } from '../lib/supabase';
import UserProfileModal from '../components/UserProfileModal';
import GuestGuard from '../components/GuestGuard';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import { emitEvent, Events } from '../lib/events';
import { BERLIN_DISTRICTS } from '../lib/constants';

export default function HousingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [housing, setHousing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editingHousing, setEditingHousing] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGuestGuard, setShowGuestGuard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadHousing();
  }, [id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('is_admin').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
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
          .single();
        setProfile(data);
      }
    } catch (e) {
      console.warn('Error checking auth:', e);
    }
  };

  const loadHousing = async () => {
    try {
      setLoading(true);
      console.log('[HousingDetailPage] Завантаження житла з ID:', id);
      const data = await getHousingById(id);
      console.log('[HousingDetailPage] Отримано дані:', data);
      setHousing(data);
      if (data?.user_id) {
        const map = await getProfilesByIds([data.user_id]);
        setAuthorProfile(map.get(data.user_id) ?? null);
      } else {
        setAuthorProfile(null);
      }
    } catch (error) {
      console.error('Error loading housing:', error);
      // For now, use mock data if Supabase is not configured
      const mock = getMockHousing(id);
      setHousing(mock);
      setAuthorProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demo
  const getMockHousing = (housingId) => {
    const mockHousing = {
      '1': {
        id: '1',
        title: '2-кімнатна квартира біля метро',
        type: 'apartment',
        description: 'Затишна квартира в центрі Берліна, біля станції метро. Ідеально підходить для молодої сім\'ї або пари.\n\nОсобливості:\n- Повністю мебльована\n- Балкон з видом на парк\n- Підігрів підлоги\n- Парковочне місце\n- Дозволено з тваринами',
        price: 950,
        size: 65,
        rooms: 2,
        address: 'Warschauer Str. 23',
        district: 'Friedrichshain',
        contact_name: 'Олена',
        contact_email: 'elena@example.com',
        contact_phone: '+49 176 123 4567',
        created_at: '2026-01-15T10:00:00Z',
      },
      '2': {
        id: '2',
        title: 'Кімната в WG',
        type: 'room',
        description: 'Шукаю співмешканця в friendly WG. У нас завжди весело, часто готуємо разом, дивимось фільми.\n\nЩо пропонуємо:\n- Велика світла кімната\n- Спільна кухня та ванна\n- Wi-Fi включено\n- Дружня атмосфера',
        price: 450,
        size: 18,
        rooms: 1,
        address: 'Sonnenallee 89',
        district: 'Neukölln',
        contact_name: 'Марія',
        contact_phone: '+49 176 234 5678',
        created_at: '2026-01-18T14:30:00Z',
      },
    };
    return mockHousing[housingId] || mockHousing['1'];
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

  const getTypeIcon = (type) => {
    const icons = {
      'apartment': Building2,
      'room': Users,
      'studio': Layout,
      'house': Warehouse,
    };
    return icons[type] || HomeIcon;
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

  const handleDeleteHousing = async () => {
    if (!window.confirm('Ви впевнені, що хочете видалити це оголошення? Цю дію неможливо скасувати.')) {
      return;
    }

    try {
      await deleteHousing(housing.id);
      alert('Оголошення успішно видалено!');
      emitEvent(Events.HOUSING_ADDED);
      emitEvent(Events.HOUSING_DELETED);
      navigate('/housing');
    } catch (error) {
      console.error('Error deleting housing:', error);
      alert('Помилка при видаленні оголошення. Спробуйте ще раз.');
    }
  };

  const isOwner = user?.id === housing?.user_id;
  const isAdmin = profile?.is_admin === true;
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center">
            <div className="w-16 h-16 bg-vibrant-yellow/10 rounded-full animate-pulse mx-auto mb-4" />
            <p className="text-gray-500">Завантаження...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!housing) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center">
            <HomeIcon size={48} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Оголошення не знайдено</h2>
            <button
              onClick={() => navigate('/housing')}
              className="px-6 py-3 bg-vibrant-yellow text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Повернутися до списку
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TypeIcon = getTypeIcon(housing.type);

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
          onClick={() => navigate('/housing')}
          className="flex items-center gap-2 text-gray-600 hover:text-vibrant-yellow font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Назад до житла</span>
        </motion.button>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
          {/* Header */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 break-words">
                  {housing.title}
                </h1>
                <div className="flex items-center gap-3 text-gray-600">
                  <TypeIcon size={18} className="text-vibrant-yellow" />
                  <span className="font-semibold">{getTypeLabel(housing.type)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {canEdit && (
                  <button
                    onClick={() => setEditingHousing(housing)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-vibrant-yellow/10 text-vibrant-yellow rounded-xl hover:bg-vibrant-yellow/20 transition-colors font-semibold text-xs md:text-sm whitespace-nowrap"
                  >
                    <Edit2 size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Редагувати</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeleteHousing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold text-xs md:text-sm shadow-md hover:shadow-lg border-2 border-red-600 whitespace-nowrap"
                  >
                    <Trash2 size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Видалити</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Euro size={18} className="text-vibrant-yellow" />
                <div>
                  <p className="text-xs text-gray-500">Ціна</p>
                  <p className="font-bold text-gray-900">
                    €{housing.price}/міс
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <MapPin size={18} className="text-vibrant-yellow" />
                <div>
                  <p className="text-xs text-gray-500">Локація</p>
                  <p className="font-bold text-gray-900">{housing.district || housing.address}</p>
                </div>
              </div>
              {housing.size && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Maximize size={18} className="text-vibrant-yellow" />
                  <div>
                    <p className="text-xs text-gray-500">Площа</p>
                    <p className="font-bold text-gray-900">{housing.size} м²</p>
                  </div>
                </div>
              )}
            </div>

            {/* Автор публікації — тільки якщо не власник */}
            {housing.user_id && !isOwner && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) { setShowGuestGuard(true); return; }
                      setSelectedUserId(housing.user_id);
                      setShowUserModal(true);
                    }}
                    className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-amber-50 transition-colors text-left group"
                  >
                    {authorProfile?.avatar_url ? (
                      <img
                        src={authorProfile.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-vibrant-yellow to-amber-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                        {(authorProfile?.full_name || housing.author_name || 'К').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Опублікував</p>
                      <p className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                        {authorProfile?.full_name || housing.author_name || 'Користувач'}
                      </p>
                    </div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { setShowGuestGuard(true); return; }
                    navigate(`/messages/${housing.user_id}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-vibrant-yellow to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <MessageSquare size={18} />
                  <span>Написати автору</span>
                </button>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <HomeIcon size={18} className="text-gray-400" />
              <h3 className="font-bold text-gray-900">Деталі</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {housing.rooms && (
                <span className="px-3 py-1.5 bg-vibrant-yellow text-white rounded-lg text-sm font-bold">
                  {housing.rooms} {housing.rooms === 1 ? 'кімната' : housing.rooms < 5 ? 'кімнати' : 'кімнат'}
                </span>
              )}
              {housing.size && (
                <span className="px-3 py-1.5 bg-vibrant-yellow/20 text-vibrant-yellow rounded-lg text-sm font-bold">
                  {housing.size} м²
                </span>
              )}
              <span className="px-3 py-1.5 bg-vibrant-yellow/20 text-vibrant-yellow rounded-lg text-sm font-bold">
                {getTypeLabel(housing.type)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Опис</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {housing.description}
            </p>
          </div>

          {/* Address */}
          {housing.address && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Адреса</h3>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin size={18} className="text-vibrant-yellow" />
                <span className="font-medium">{housing.address}</span>
              </div>
            </div>
          )}

          {/* Contact */}
          {(housing.contact_name || housing.contact_email || housing.contact_phone || housing.website) && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Контактна інформація</h3>
              <div className="space-y-3">
                {housing.contact_name && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-700 font-medium">{housing.contact_name}</span>
                  </div>
                )}
                {housing.contact_email && (
                  <a
                    href={`mailto:${housing.contact_email}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-vibrant-yellow hover:bg-vibrant-yellow/5 transition-all group"
                  >
                    <Mail size={20} className="text-slate-500 group-hover:text-vibrant-yellow" />
                    <span className="text-slate-700 font-medium group-hover:text-vibrant-yellow">
                      {housing.contact_email}
                    </span>
                  </a>
                )}
                {housing.contact_phone && (
                  <a
                    href={`tel:${housing.contact_phone}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-vibrant-yellow hover:bg-vibrant-yellow/5 transition-all group"
                  >
                    <Phone size={20} className="text-slate-500 group-hover:text-vibrant-yellow" />
                    <span className="text-slate-700 font-medium group-hover:text-vibrant-yellow">
                      {housing.contact_phone}
                    </span>
                  </a>
                )}
                {housing.website && (
                  <a
                    href={housing.website.startsWith('http') ? housing.website : `https://${housing.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-vibrant-yellow hover:bg-vibrant-yellow/5 transition-all group"
                  >
                    <Globe size={20} className="text-slate-500 group-hover:text-vibrant-yellow" />
                    <span className="text-slate-700 font-medium group-hover:text-vibrant-yellow">
                      {housing.website}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>Опубліковано {getTimeAgo(housing.created_at)}</span>
            {housing.user_id && (
              <span className="text-xs">ID: {housing.user_id.slice(0, 8)}...</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit Housing Modal */}
      {editingHousing && createPortal(
        <EditHousingModal 
          housing={editingHousing}
          onClose={() => setEditingHousing(null)}
          onSuccess={async (updatedData) => {
            console.log('[HousingDetailPage] onSuccess викликано з даними:', updatedData);
            
            if (!updatedData) {
              console.error('[HousingDetailPage] Помилка: updatedData порожній');
              return;
            }
            
            // Оновлюємо локальний стан одразу з отриманими даними
            console.log('[HousingDetailPage] Оновлення локального стану з:', updatedData);
            setHousing(updatedData);
            
            // Закриваємо модальне вікно
            setEditingHousing(null);
            
            // Невелика затримка перед перезавантаженням з сервера для гарантії
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('[HousingDetailPage] Перезавантаження з сервера...');
            await loadHousing();
            emitEvent(Events.HOUSING_ADDED);
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

// Edit Housing Modal Component
function EditHousingModal({ housing, onClose, onSuccess }) {
  const [formData, setFormData] = useState(() => {
    const initialData = {
      title: housing?.title || '',
      type: housing?.type || 'apartment',
      description: housing?.description || '',
      price: housing?.price?.toString() || '',
      size: housing?.size?.toString() || '',
      rooms: housing?.rooms?.toString() || '',
      address: housing?.address || '',
      district: housing?.district || '',
      contact_name: housing?.contact_name || '',
      contact_email: housing?.contact_email || '',
      contact_phone: housing?.contact_phone || '',
      website: housing?.website || '',
    };
    console.log('[EditHousingModal] Ініціалізація formData з housing:', housing);
    console.log('[EditHousingModal] Початкові дані форми:', initialData);
    return initialData;
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log('[EditHousingModal] handleSubmit викликано, formData:', formData);
    
    if (!formData.title || !formData.price || !formData.address || !formData.description || !formData.contact_phone) {
      alert('Будь ласка, заповніть усі обов\'язкові поля (*)');
      return;
    }

    try {
      setSubmitting(true);

      const housingData = {
        title: formData.title.trim(),
        type: formData.type || 'apartment',
        description: formData.description.trim(),
        price: parseInt(formData.price, 10) || 0,
        size: formData.size ? parseInt(formData.size, 10) : null,
        rooms: formData.rooms ? parseInt(formData.rooms, 10) : null,
        address: formData.address.trim(),
        district: formData.district || null,
        contact_name: formData.contact_name?.trim() || null,
        contact_email: formData.contact_email?.trim() || null,
        contact_phone: formData.contact_phone?.trim() || null,
        website: formData.website?.trim() || null,
      };

      console.log('[EditHousingModal] Відправка оновлення...', { id: housing.id, housingData });
      console.log('[EditHousingModal] Повний об\'єкт housingData:', JSON.stringify(housingData, null, 2));
      
      // Перевірка, що дані не порожні
      if (!housingData.title || !housingData.price) {
        console.error('[EditHousingModal] Помилка: housingData порожній або некоректний:', housingData);
        alert('Помилка: дані форми некоректні. Спробуйте ще раз.');
        setSubmitting(false);
        return;
      }
      
      const updated = await updateHousing(housing.id, housingData);
      console.log('[EditHousingModal] Оновлено:', updated);
      console.log('[EditHousingModal] Порівняння: очікувані дані:', housingData, 'отримані дані:', updated);
      
      if (!updated) {
        console.error('[EditHousingModal] Помилка: оновлені дані не отримано');
        alert('Помилка при оновленні. Спробуйте ще раз.');
        setSubmitting(false);
        return;
      }
      
      // Перевірка, чи дані дійсно оновились
      if (updated.price !== parseInt(housingData.price, 10) || updated.title !== housingData.title) {
        console.warn('[EditHousingModal] УВАГА: Дані не збігаються! Очікувалось:', housingData, 'Отримано:', updated);
        console.warn('[EditHousingModal] Можлива проблема з RLS політиками або кешуванням');
      }
      
      alert('Оголошення успішно оновлено!');
      // Передаємо оновлені дані в onSuccess ПЕРЕД закриттям модального вікна
      onSuccess(updated);
    } catch (error) {
      console.error('Error updating housing:', error);
      alert(`Помилка при оновленні оголошення:\n\n${error.message || 'Невідома помилка'}`);
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
              <div className="w-12 h-12 bg-gradient-to-br from-vibrant-yellow to-orange-400 rounded-2xl flex items-center justify-center">
                <HomeIcon size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Редагувати житло</h2>
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
              <label className="block text-sm font-bold text-gray-900 mb-2">Заголовок *</label>
              <input
                type="text"
                placeholder="2-кімнатна квартира біля метро"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Тип житла *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
              >
                <option value="apartment">Квартира</option>
                <option value="room">Кімната</option>
                <option value="studio">Студія</option>
                <option value="house">Будинок</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Ціна (€) *</label>
                <input
                  type="number"
                  placeholder="950"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Площа (м²)</label>
                <input
                  type="number"
                  placeholder="65"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Кімнат</label>
                <input
                  type="number"
                  placeholder="2"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Адреса *</label>
              <input
                type="text"
                placeholder="Warschauer Str. 23"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Район</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
              >
                <option value="">Оберіть район</option>
                {BERLIN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Опис *</label>
              <textarea
                placeholder="Детальний опис житла..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Ваше ім'я</label>
              <input
                type="text"
                placeholder="Олена"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Телефон *</label>
              <input
                type="tel"
                placeholder="+49 176 123 4567"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Веб-сайт</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vibrant-yellow focus:border-vibrant-yellow transition-all"
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-vibrant-yellow to-orange-400 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Збереження...' : 'Зберегти зміни'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
