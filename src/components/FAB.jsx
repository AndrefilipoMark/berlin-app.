import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Home, MessageCircle, Building2, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { JobFormModal, HousingFormModal, ServiceFormModal, ForumPostFormModal } from './FormModals';
import GuestGuard from './GuestGuard';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

export default function FAB() {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showGuestGuard, setShowGuestGuard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Визначаємо, чи показувати FAB та яку дію виконувати
  const getFabConfig = () => {
    switch (location.pathname) {
      case '/jobs':
        return { show: true, action: 'job', icon: Briefcase, color: 'from-azure-blue to-blue-600' };
      case '/housing':
        return { show: true, action: 'housing', icon: Home, color: 'from-vibrant-yellow to-amber-500' };
      case '/services':
        return { show: true, action: 'service', icon: Sparkles, color: 'from-teal-500 to-teal-600' };
      case '/forum':
        return { show: true, action: 'forum', icon: MessageCircle, color: 'from-green-500 to-emerald-600' };
      default:
        return { show: false, action: null, icon: Plus, color: 'from-azure-blue to-blue-600' };
    }
  };

  const { show, action, icon: Icon, color } = getFabConfig();

  useEffect(() => {
    // Перевіряємо авторизацію
    const checkUser = async () => {
      setLoadingUser(true);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoadingUser(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const closeFormModal = useCallback(() => {
    setShowForm(false);
    setFormType(null);
  }, []);

  const handleClick = async () => {
    let currentUser = user;
    if (loadingUser) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoadingUser(false);
    }

    if (!currentUser) {
      setShowGuestGuard(true);
      return;
    }
    if (action) {
      setFormType(action);
      setShowForm(true);
    }
  };

  // Якщо ми на Dashboard або іншій непідтримуваній сторінці — не рендеримо FAB
  if (!show) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Main FAB Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-2xl transition-all group`}
      >
        <Icon size={28} className="text-white transition-transform group-hover:scale-110" strokeWidth={3} />
      </motion.button>

      {/* Form Modals — портал у body, щоб модалка була поверх усього */}
      {createPortal(
        <AnimatePresence>
          {showForm && formType && (
            <motion.div
              key={`form-modal-${formType}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeFormModal();
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
              >
                {formType === 'job' && <JobFormModal onClose={closeFormModal} />}
                {formType === 'housing' && <HousingFormModal onClose={closeFormModal} />}
                {formType === 'service' && <ServiceFormModal onClose={closeFormModal} />}
                {formType === 'forum' && <ForumPostFormModal onClose={closeFormModal} />}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Guest Guard */}
      <AnimatePresence>
        {showGuestGuard && (
          <GuestGuard
            onClose={() => setShowGuestGuard(false)}
            onLogin={() => setShowLoginModal(true)}
            onRegister={() => setShowRegisterModal(true)}
          />
        )}
      </AnimatePresence>

      {/* Auth Modals */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRegisterModal && (
          <RegisterModal
            onClose={() => setShowRegisterModal(false)}
            onSwitchToLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
