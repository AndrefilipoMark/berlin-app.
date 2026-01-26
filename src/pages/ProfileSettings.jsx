import { motion } from 'framer-motion';
import { User, Users, MapPin, FileText, Save, Loader2, CheckCircle, Camera, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const BERLIN_DISTRICTS = [
  'Не вказано',
  'Mitte',
  'Friedrichshain-Kreuzberg',
  'Pankow',
  'Charlottenburg-Wilmersdorf',
  'Spandau',
  'Steglitz-Zehlendorf',
  'Tempelhof-Schöneberg',
  'Neukölln',
  'Treptow-Köpenick',
  'Marzahn-Hellersdorf',
  'Lichtenberg',
  'Reinickendorf',
];

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    district: '',
    gender: '',
    bio: '',
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/');
        return;
      }

      setUser(session.user);
      await loadProfile(session.user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/');
    }
  };

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;

      if (data) {
        const name = (data.full_name || '').slice(0, 24);
        setFormData({
          full_name: name,
          district: data.district || '',
          gender: data.gender || '',
          bio: data.bio || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (!formData.full_name.trim()) {
      setError("Ім'я не може бути порожнім");
      toast.error("Ім'я не може бути порожнім");
      return;
    }

    try {
      setSaving(true);

      if (!user?.id) {
        throw new Error('Користувач не авторизований');
      }

      const name = formData.full_name.trim().slice(0, 24);
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: name,
          district: formData.district || null,
          gender: formData.gender || null,
          bio: formData.bio.trim() || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Profile saved successfully:', data);
      
      setSaved(true);
      toast.success('✅ Зміни збережено!', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '16px',
          padding: '16px',
        },
      });

      // Відправляємо подію для синхронізації з Navigation
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { 
          full_name: data.full_name,
          district: data.district,
          gender: data.gender,
          bio: data.bio 
        } 
      }));

      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Помилка при збереженні: ' + error.message);
      toast.error('❌ Помилка: ' + error.message, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'завантаження...';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'щойно';
    return date.toLocaleDateString('uk-UA', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center border border-gray-200">
              <User size={32} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">
                Налаштування профілю
              </h1>
              <p className="text-gray-600">
                Розкажіть про себе спільноті
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bento Grid Layout */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Avatar - Large Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-36 h-36 md:w-40 md:h-40 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-6xl md:text-7xl">
                    {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'У'}
                  </span>
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 hover:scale-110 transition-all"
                  title="Змінити фото (скоро)"
                >
                  <Camera size={20} strokeWidth={2} />
                </button>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {formData.full_name || 'Ваше ім\'я'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {user?.email}
              </p>
              {formData.district && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl text-gray-700 text-sm font-semibold">
                  <MapPin size={16} className="text-blue-600" />
                  <span>{formData.district}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Form Fields - Large Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <User size={24} className="text-blue-600" strokeWidth={2} />
              Особиста інформація
            </h2>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Ім'я *
                </label>
                <input
                  type="text"
                  placeholder="Ваше повне ім'я"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  maxLength={24}
                  className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  disabled={saving}
                />
                <p className="mt-2 text-xs text-gray-500">
                  {formData.full_name.length}/24 символів
                </p>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" strokeWidth={2} />
                  Твій район у Берліні
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  disabled={saving}
                >
                  {BERLIN_DISTRICTS.map(district => (
                    <option key={district} value={district === 'Не вказано' ? '' : district}>
                      {district}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Це допоможе знайти сусідів з вашого району
                </p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" strokeWidth={2} />
                  Стать
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  disabled={saving}
                >
                  <option value="">Оберіть стать</option>
                  <option value="male">Чоловік</option>
                  <option value="female">Жінка</option>
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" strokeWidth={2} />
                  Про себе
                </label>
                <textarea
                  placeholder="Розкажіть трохи про себе, чим займаєтесь, що вас цікавить..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
                  disabled={saving}
                />
                <p className="mt-2 text-xs text-gray-500">
                  {formData.bio.length}/500 символів
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-2xl"
                >
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </motion.div>
              )}

              {/* Success Message */}
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2"
                >
                  <CheckCircle size={20} className="text-green-600" />
                  <p className="text-sm text-green-600 font-medium">Профіль успішно збережено!</p>
                </motion.div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base rounded-2xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Збереження...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} strokeWidth={2} />
                    <span>Зберегти зміни</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Member Since */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Calendar size={24} className="text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Член спільноти з</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatJoinDate(user?.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MapPin size={24} className="text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Локація</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formData.district || 'Берлін'}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Status */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <User size={24} className="text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Статус профілю</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formData.full_name && formData.district && formData.bio ? 'Повний' : 'Базовий'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
