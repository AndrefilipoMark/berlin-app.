import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, sendPrivateMessage } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function QuickMessageModal({ receiverId, receiverName, onClose, onSent }) {
  const navigate = useNavigate();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
  };

  const handleSend = async () => {
    if (!messageText.trim() || !currentUser?.id || !receiverId || sending) return;

    try {
      setSending(true);
      await sendPrivateMessage(currentUser.id, receiverId, messageText.trim());
      setMessageText('');
      if (onSent) onSent();
      
      // Показуємо повідомлення про успіх
      alert('Повідомлення відправлено!');
      
      // Закриваємо модальне вікно
      onClose();
      
      // Перенаправляємо на сторінку повідомлень
      navigate(`/messages/${receiverId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message || 'Помилка при відправці повідомлення');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[32px] shadow-2xl max-w-md w-full"
        >
          <div className="bg-gradient-to-r from-azure-blue to-blue-600 text-white p-6 rounded-t-[32px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Написати повідомлення</h2>
                  <p className="text-blue-100 text-sm">Користувачу: {receiverName || 'Користувач'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Повідомлення
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-azure-blue focus:ring-2 focus:ring-azure-blue/20 outline-none transition-all resize-none"
                placeholder="Введіть ваше повідомлення..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-azure-blue to-blue-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Відправка...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Відправити</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
