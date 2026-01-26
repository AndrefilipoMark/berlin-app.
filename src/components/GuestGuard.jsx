import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, LogIn, Lock } from 'lucide-react';

export default function GuestGuard({ onClose, onLogin, onRegister }) {
  const handleLogin = () => {
    onClose();
    onLogin();
  };

  const handleRegister = () => {
    onClose();
    onRegister();
  };

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="flex justify-end p-4">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              type="button"
              aria-label="Закрити"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="px-8 pb-8 pt-0">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-azure-blue to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock size={32} className="text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Потрібна авторизація
              </h2>
              <p className="text-sm text-gray-600">
                Щоб користуватися цією функцією, увійдіть або зареєструйтесь
              </p>
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleLogin}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-azure-blue to-blue-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={20} strokeWidth={2.5} />
                Увійти
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleRegister}
                className="w-full py-3 px-4 bg-gray-100 text-gray-800 font-semibold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={20} strokeWidth={2.5} />
                Створити акаунт
              </motion.button>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
              >
                Скасувати
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-3">
                З акаунтом ви зможете:
              </p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Додавати вакансії, житло та сервіси</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Писати пости на форумі</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Спілкуватись у чаті та надсилати повідомлення</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Редагувати свої публікації</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
