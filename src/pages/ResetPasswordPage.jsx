import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session or if the URL has a recovery token
    // Supabase handles the recovery token automatically if detectSessionInUrl is true
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !window.location.hash.includes('type=recovery')) {
        // If no session and not a recovery link, redirect home
        console.warn('No active recovery session found');
        // We don't redirect immediately to allow the hash to be processed
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }

    if (password.length < 6) {
      setError('Пароль має бути не менше 6 символів');
      return;
    }

    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-8 md:p-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-azure-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            Новий пароль
          </h2>
          <p className="text-sm text-gray-600">
            Встановіть новий пароль для вашого акаунта
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center justify-center gap-4 p-6 bg-green-50 border border-green-200 rounded-3xl">
              <CheckCircle2 size={48} className="text-green-500" />
              <div className="space-y-1">
                <p className="text-lg font-bold text-green-900">Пароль оновлено!</p>
                <p className="text-sm text-green-700">
                  Ваш пароль успішно змінено. Ви будете перенаправлені на головну сторінку через кілька секунд.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
            >
              На головну
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl"
              >
                <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </motion.div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Новий пароль
              </label>
              <div className="relative">
                <Lock 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                />
                <input
                  type="password"
                  placeholder="Мінімум 6 символів"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Підтвердіть пароль
              </label>
              <div className="relative">
                <Lock 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                />
                <input
                  type="password"
                  placeholder="Повторіть новий пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-azure-blue to-blue-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-blue-200 shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Оновлення...</span>
                </>
              ) : (
                <span>Оновити пароль</span>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
