import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, AlertCircle, CheckCircle, Loader2, Bug, Lightbulb, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

export default function ContactAdmin({ asLink = false, asButton = false, linkText = "Написати адміну" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    messageType: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const messageTypes = [
    { value: 'general', label: 'Загальне', icon: MessageCircle },
    { value: 'bug', label: 'Помилка/Баг', icon: Bug },
    { value: 'suggestion', label: 'Пропозиція', icon: Lightbulb },
    { value: 'feedback', label: 'Відгук', icon: MessageSquare },
  ];

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError('');
    setSuccess(false);

    if (!formData.name.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }

    try {
      setLoading(true);

      // Get current user if logged in
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const { error: insertError } = await supabase
        .from('admin_messages')
        .insert({
          user_id: userId,
          user_name: formData.name.trim(),
          user_email: formData.email.trim() || null,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          message_type: formData.messageType,
          status: 'new'
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        messageType: 'general'
      });

      // Close form after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      // Більш детальна помилка для користувача
      if (err?.code === 'PGRST205' || err?.message?.includes('admin_messages')) {
        setError('Таблиця для повідомлень ще не створена. Будь ласка, зверніться до адміністратора.');
      } else {
        setError('Помилка при відправці повідомлення. Спробуйте ще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Link or Button */}
      {asButton ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-azure-blue to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-azure-blue/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageSquare size={18} />
          {linkText}
        </button>
      ) : asLink ? (
        <button
          onClick={() => setIsOpen(true)}
          className="text-azure-blue hover:text-blue-700 underline text-xs font-medium transition-colors inline-flex items-center gap-1"
        >
          <MessageSquare size={14} />
          {linkText}
        </button>
      ) : (
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-28 right-6 z-40 w-14 h-14 bg-gradient-to-br from-azure-blue to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:shadow-blue-500/50 transition-all"
          title="Написати адміну"
        >
          <MessageSquare size={24} />
        </motion.button>
      )}

      {/* Modal - rendered via portal to ensure it's above everything */}
      {isOpen && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              style={{ position: 'fixed' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsOpen(false);
                  setSuccess(false);
                  setError('');
                }
              }}
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative"
              style={{ 
                maxHeight: '90vh',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-azure-blue to-blue-600 text-white p-5 md:p-6 rounded-t-3xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <MessageSquare size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold">Написати адміну</h2>
                      <p className="text-blue-100 text-xs md:text-sm">Повідомлення, пропозиції, помилки</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setSuccess(false);
                      setError('');
                    }}
                    className="w-9 h-9 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label="Закрити"
                  >
                    <X size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Form - scrollable content */}
              <div className="flex-1 overflow-y-auto min-h-0" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <form id="contact-admin-form" onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              {/* Message Type */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Тип повідомлення
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {messageTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.messageType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, messageType: type.value })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-azure-blue bg-azure-blue/10 text-azure-blue'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon size={20} className="mx-auto mb-1" />
                        <div className="text-xs font-medium">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Ваше ім'я <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm rounded-xl border border-gray-200 focus:border-azure-blue focus:ring-2 focus:ring-azure-blue/20 outline-none transition-all"
                  placeholder="Введіть ваше ім'я"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Email (необов'язково)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm rounded-xl border border-gray-200 focus:border-azure-blue focus:ring-2 focus:ring-azure-blue/20 outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Тема <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm rounded-xl border border-gray-200 focus:border-azure-blue focus:ring-2 focus:ring-azure-blue/20 outline-none transition-all"
                  placeholder="Короткий опис"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Повідомлення <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm rounded-xl border border-gray-200 focus:border-azure-blue focus:ring-2 focus:ring-azure-blue/20 outline-none transition-all resize-none min-h-[120px]"
                  placeholder="Опишіть ваше питання, пропозицію або помилку..."
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-2.5 md:p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span className="text-xs md:text-sm">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-2.5 md:p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  <CheckCircle size={18} className="flex-shrink-0" />
                  <span className="text-xs md:text-sm">Повідомлення успішно відправлено! Дякуємо за ваш відгук.</span>
                </div>
              )}

                </form>
              </div>

              {/* Submit Button - Fixed at bottom */}
              <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-4 md:p-6 rounded-b-3xl">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setSuccess(false);
                      setError('');
                    }}
                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm md:text-base font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    form="contact-admin-form"
                    disabled={loading}
                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-azure-blue to-blue-600 text-white text-sm md:text-base font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Відправка...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Відправити</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
