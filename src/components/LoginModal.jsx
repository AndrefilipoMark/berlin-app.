import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginModal({ onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('login'); // 'login' or 'forgot-password'
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Login successful:', data);
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        setError('Невірний email або пароль');
      } else if (error.message?.includes('Email not confirmed')) {
        setError(
          'Увімкнено підтвердження email. Вимкніть у Supabase: Authentication → Providers → Email → «Confirm email» (off) і збережіть. Або перевірте пошту та натисніть посилання з листа.'
        );
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Будь ласка, введіть ваш email');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
          className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-8 md:p-10 relative"
        >
          {/* Close Button */}
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

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-azure-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LogIn size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              {view === 'login' ? 'Вхід' : 'Відновлення пароля'}
            </h2>
            <p className="text-sm text-gray-600">
              {view === 'login' 
                ? 'З поверненням у спільноту!' 
                : 'Введіть ваш email, щоб отримати посилання для зміни пароля'}
            </p>
          </div>

          {/* Form */}
          {resetSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                <p className="text-sm text-green-700 font-medium">
                  Посилання для відновлення пароля надіслано на вашу пошту. Будь ласка, перевірте її.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setResetSent(false);
                }}
                className="text-azure-blue font-bold hover:underline transition-colors"
              >
                Повернутися до входу
              </button>
            </div>
          ) : (
            <form onSubmit={view === 'login' ? handleLogin : handleForgotPassword} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-2xl"
                >
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail 
                    size={20} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                  />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              {view === 'login' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-900">
                      Пароль
                    </label>
                    <button
                      type="button"
                      onClick={() => setView('forgot-password')}
                      className="text-xs font-semibold text-azure-blue hover:underline"
                      disabled={loading}
                    >
                      Забули пароль?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock 
                      size={20} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                    />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-azure-blue focus:bg-white transition-all"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-azure-blue to-blue-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{view === 'login' ? 'Вхід...' : 'Відправка...'}</span>
                  </>
                ) : (
                  <>
                    {view === 'login' ? (
                      <>
                        <LogIn size={20} />
                        <span>Увійти</span>
                      </>
                    ) : (
                      <span>Надіслати посилання</span>
                    )}
                  </>
                )}
              </button>

              {view === 'forgot-password' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-sm font-semibold text-gray-500 hover:text-azure-blue transition-colors"
                    disabled={loading}
                  >
                    Повернутися до входу
                  </button>
                </div>
              )}

              {/* Switch to Register */}
              <div className="text-center pt-5 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Немає акаунта?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-azure-blue font-bold hover:underline transition-colors"
                    disabled={loading}
                  >
                    Зареєструватися
                  </button>
                </p>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
