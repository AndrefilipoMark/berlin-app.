import { motion, AnimatePresence } from 'framer-motion';
import { Home, Briefcase, Building2, MessageCircle, MessageSquare, Sparkles, LogIn, LogOut, User, Shield, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase, updateLastSeen, getFriendRequests, getUnreadMessagesCount } from '../lib/supabase';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

// ADMIN EMAIL - замініть на ваш реальний email
const ADMIN_EMAILS = [
  'andrefilipoua@gmail.com',
  'test@example.com',
  'admin@berlin-app.com',
];

const navItems = [
  { path: '/', label: 'Головна', icon: Home },
  { path: '/jobs', label: 'Вакансії', icon: Briefcase },
  { path: '/housing', label: 'Житло', icon: Building2 },
  { path: '/services', label: 'Послуги', icon: Sparkles },
  { path: '/forum', label: 'Форум', icon: MessageCircle },
  { path: '/chat', label: 'Чат', icon: MessageSquare },
];

export default function Navigation() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    // Отримуємо поточного користувача
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    // Слухаємо зміни в автентифікації
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Слухаємо оновлення профілю з ProfileSettings
    const handleProfileUpdate = (event) => {
      console.log('Profile updated event received:', event.detail);
      // Використовуємо event.detail щоб оновити профіль напряму
      setProfile(prevProfile => ({
        ...prevProfile,
        ...event.detail
      }));
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    updateLastSeen(uid);
    const interval = setInterval(() => updateLastSeen(uid), 90 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Real-time subscription for unread messages
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Setting up real-time subscription for unread messages');

    const channel = supabase
      .channel(`unread_messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 New message received:', payload.new);
          // Оновлюємо лічильник при новому повідомленні
          loadUnreadMessagesCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 Message updated:', payload.new);
          // Оновлюємо лічильник при оновленні повідомлення (наприклад, коли воно прочитане)
          if (payload.new.read === true) {
            loadUnreadMessagesCount();
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Unread messages subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to unread messages updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel subscription error:', err);
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from unread messages updates');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadFriendRequests();
      loadUnreadMessagesCount();
      // Оновлюємо кожні 30 секунд
      const interval = setInterval(() => {
        loadFriendRequests();
        loadUnreadMessagesCount();
      }, 30 * 1000);
      return () => clearInterval(interval);
    } else {
      setFriendRequestsCount(0);
      setUnreadMessagesCount(0);
    }
  }, [user?.id]);

  const loadFriendRequests = async () => {
    if (!user?.id) return;
    try {
      const requests = await getFriendRequests(user.id);
      setFriendRequestsCount(requests.length);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadUnreadMessagesCount = async () => {
    if (!user?.id) return;
    try {
      const count = await getUnreadMessagesCount(user.id);
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error loading unread messages count:', error);
    }
  };

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    console.log('🚪 Logout initiated...');
    
    try {
      // Крок 1: Закриваємо меню
      console.log('1️⃣ Closing menu...');
      setShowUserMenu(false);
      
      // Крок 2: Виходимо з системи через Supabase
      console.log('2️⃣ Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signOut error:', error);
        throw error;
      }
      console.log('✅ Supabase signOut successful');
      
      // Крок 3: Очищаємо стан React
      console.log('3️⃣ Clearing React state...');
      setUser(null);
      setProfile(null);
      
      // Крок 4: Примусово очищаємо локальне сховище
      console.log('4️⃣ Clearing localStorage and sessionStorage...');
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Storage cleared successfully');
      } catch (storageError) {
        console.warn('⚠️ Could not clear storage:', storageError);
        // Продовжуємо навіть якщо очищення не вдалось
      }
      
      // Крок 5: Перенаправляємо на головну сторінку
      console.log('5️⃣ Redirecting to home page...');
      window.location.replace('/');
      
    } catch (error) {
      console.error('❌ LOGOUT ERROR:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Якщо помилка - все одно пробуємо очистити та перенаправити
      console.log('⚠️ Attempting force logout...');
      try {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setProfile(null);
      } catch (cleanupError) {
        console.error('❌ Cleanup error:', cleanupError);
      }
      
      alert('Помилка при виході з системи. Будь ласка, перегляньте Console (F12) для деталей.');
    }
  };

  const getUserInitial = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'У';
  };

  // Перевіряємо адміна через is_admin з profiles або через email
  const isAdmin = profile?.is_admin || (user && ADMIN_EMAILS.includes(user.email));

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-azure-blue to-vibrant-yellow rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xl">Н</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-extrabold text-gray-900 leading-none">
                Наш дім Берлін
              </h1>
              <p className="text-xs text-gray-500">Українська спільнота</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 md:gap-2 flex-1 justify-center max-w-4xl mx-4 md:mx-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-azure-blue text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                    <span className="hidden lg:inline text-sm font-semibold">
                      {item.label}
                    </span>
                  </motion.div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 left-0 right-0 h-1 bg-azure-blue rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Login Button / User Avatar */}
          <div className="relative">
            {user ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-vibrant-yellow to-orange-400 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {getUserInitial()}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-bold text-gray-900">
                    {profile?.full_name || user?.email?.split('@')[0] || 'Користувач'}
                  </span>
                </motion.div>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ 
                        type: "spring",
                        damping: 20,
                        stiffness: 300,
                        duration: 0.2
                      }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {profile?.full_name || user?.email?.split('@')[0] || 'Користувач'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                            АДМІН
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 relative"
                      >
                        <User size={16} />
                        Моя сторінка
                        {friendRequestsCount > 0 && (
                          <span className="ml-auto px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                            {friendRequestsCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 relative"
                      >
                        <div className="relative">
                          <MessageSquare size={16} />
                          {unreadMessagesCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                          )}
                        </div>
                        Повідомлення
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <User size={16} />
                        Налаштування
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full px-4 py-3 text-left text-sm font-semibold text-yellow-700 hover:bg-yellow-50 transition-colors flex items-center gap-2"
                        >
                          <Shield size={16} />
                          Адмін-панель
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Вийти
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Backdrop to close menu */}
                {showUserMenu && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                )}
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-azure-blue text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
              >
                <LogIn size={18} strokeWidth={2.5} />
                <span className="hidden md:inline">Увійти</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

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
    </motion.nav>
  );
}
