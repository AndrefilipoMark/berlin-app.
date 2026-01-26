import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, UserPlus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function RegisterModal({ onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
    gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль має бути не менше 6 символів');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    if (!formData.agreedToTerms) {
      setError('Будь ласка, підтвердіть згоду з умовами використання');
      return;
    }

    try {
      setLoading(true);
      
      // Реєстрація користувача
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            gender: formData.gender || null,
          },
        },
      });

      if (error) throw error;

      console.log('Registration successful:', data);
      
      // Якщо реєстрація успішна, автоматично логінимося
      if (data.user) {
        // Supabase автоматично логінить після signUp, просто показуємо success
        setSuccess(true);
        
        // Закриваємо модалку та оновлюємо сторінку через 1.5 секунди
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.message.includes('already registered')) {
        setError('Цей email вже зареєстрований');
      } else if (error.message.includes('invalid email')) {
        setError('Невірний формат email');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const successContent = (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="max-w-md w-full mx-4 bg-white rounded-[32px] shadow-2xl p-10 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserPlus size={40} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
              Вітаємо!
            </h2>
            <p className="text-slate-600 mb-2">
              Ви успішно зареєструвалися та увійшли
            </p>
            <p className="text-sm text-slate-500">
              Ласкаво просимо до спільноти Berlin App!
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
    return createPortal(successContent, document.body);
  }

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ 
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3
          }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-8 md:p-10 relative max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              type="button"
              aria-label="Закрити"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-azure-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Реєстрація
            </h2>
            <p className="text-sm text-gray-600">
              Приєднуйтесь до спільноти!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-2xl"
              >
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </motion.div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Ім'я *
              </label>
              <div className="relative">
                <User 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                />
                <input
                  type="text"
                  placeholder="Ваше ім'я"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Стать
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                disabled={loading}
              >
                <option value="">Оберіть стать</option>
                <option value="male">Чоловік</option>
                <option value="female">Жінка</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Пароль *
              </label>
              <div className="relative">
                <Lock 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                />
                <input
                  type="password"
                  placeholder="Мінімум 6 символів"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Підтвердіть пароль *
              </label>
              <div className="relative">
                <Lock 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                />
                <input
                  type="password"
                  placeholder="Повторіть пароль"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <input
                type="checkbox"
                id="termsAgreement"
                checked={formData.agreedToTerms}
                onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                className="mt-1 w-5 h-5 text-azure-blue border-gray-300 rounded focus:ring-azure-blue focus:ring-2 cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="termsAgreement" className="text-sm text-gray-700 cursor-pointer flex-1">
                Я погоджуюся з{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-azure-blue font-semibold hover:underline"
                >
                  умовами використання
                </Link>
                {' '}та{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-azure-blue font-semibold hover:underline"
                >
                  політикою конфіденційності
                </Link>
                {' '}*
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-azure-blue to-blue-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Реєстрація...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Зареєструватися</span>
                </>
              )}
            </button>

            <div className="text-center pt-5 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Вже є акаунт?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-azure-blue font-bold hover:underline transition-colors"
                  disabled={loading}
                >
                  Увійти
                </button>
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
