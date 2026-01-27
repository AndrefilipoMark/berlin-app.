import { motion, AnimatePresence } from 'framer-motion';
import { Home, Briefcase, Building2, MessageCircle, MessageSquare, Sparkles, LogIn, LogOut, User, Shield, Bell, Settings, Heart } from 'lucide-react';
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
  { path: '/', label: 'Головна', icon: Home, color: 'azure-blue' },
  { path: '/jobs', label: 'Вакансії', icon: Briefcase, color: 'azure-blue' },
  { path: '/housing', label: 'Житло', icon: Building2, color: 'vibrant-yellow' },
  { path: '/services', label: 'Послуги', icon: Sparkles, color: 'teal' },
  { path: '/forum', label: 'Форум', icon: MessageCircle, color: 'green' },
  { path: '/chat', label: 'Чат', icon: MessageSquare, color: 'azure-blue' },
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

  // Color mapping for active tab indicator and icon color
  const getActiveColor = (color, type = 'bg') => {
    const colorMap = {
      'azure-blue': {
        bg: 'bg-azure-blue',
        text: 'text-azure-blue'
      },
      'vibrant-yellow': {
        bg: 'bg-vibrant-yellow',
        text: 'text-vibrant-yellow'
      },
      'purple': {
        bg: 'bg-purple-500',
        text: 'text-purple-500'
      },
      'teal': {
        bg: 'bg-teal-600',
        text: 'text-teal-600'
      },
      'green': {
        bg: 'bg-green-500',
        text: 'text-green-500'
      }
    };
    const colors = colorMap[color] || colorMap['azure-blue'];
    return colors[type];
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100/50 shadow-sm"
    >
      <div className="max-w-[1600px] mx-auto px-3 md:px-6">
        <div className="h-14 md:h-16 flex items-center justify-between gap-2 md:gap-4">
          {/* Navigation Links - Centered with horizontal scroll on mobile */}
          <div className="flex items-center gap-1.5 md:gap-3 lg:gap-4 flex-1 justify-center overflow-x-auto scrollbar-hide px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Improved active state detection for sub-routes
              const isActive = item.path === '/' 
                ? location.pathname === '/'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const activeBgColor = getActiveColor(item.color, 'bg');
              const activeTextColor = getActiveColor(item.color, 'text');
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex-shrink-0"
                >
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center px-2 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all ${
                      isActive 
                        ? (item.color === 'teal' ? 'bg-teal-50' : `${activeBgColor}/10`)
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Icon 
                      size={18} 
                      className={`md:w-5 md:h-5 transition-colors ${
                        isActive 
                          ? activeTextColor
                          : 'text-gray-500'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`text-[10px] md:text-xs leading-none mt-0.5 md:mt-1 transition-colors font-medium whitespace-nowrap ${
                      isActive 
                        ? 'text-gray-900' 
                        : 'text-gray-500'
                    }`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 md:w-8 h-0.5 ${activeBgColor} rounded-full`}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Login Button / User Avatar - Right side */}
          <div className="flex-shrink-0 relative">
            {user ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 bg-gray-50 hover:bg-gray-100 rounded-lg md:rounded-xl cursor-pointer transition-all"
                >
                  <div className="w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-vibrant-yellow to-orange-400 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-xs md:text-sm">
                      {getUserInitial()}
                    </span>
                  </div>
                  <span className="hidden lg:block text-sm font-bold text-gray-900">
                    {profile?.full_name || user?.email?.split('@')[0] || 'Користувач'}
                  </span>
                </motion.div>

                {/* User Dropdown Menu - Premium Ukrainian Design */}
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
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100/50 overflow-hidden z-50 backdrop-blur-sm"
                    >
                      {/* Ukrainian Flag Gradient Header */}
                      <div className="relative bg-gradient-to-r from-azure-blue via-azure-blue to-vibrant-yellow p-3 pb-4">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-azure-blue via-vibrant-yellow to-azure-blue"></div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30 shadow-md">
                            <span className="text-white font-bold text-base">
                              {getUserInitial()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold text-white truncate drop-shadow-sm">
                              {profile?.full_name || user?.email?.split('@')[0] || 'Користувач'}
                            </p>
                            <p className="text-[10px] text-white/90 truncate mt-0.5">
                              {user.email}
                            </p>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-0.5 mt-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[9px] font-bold rounded-full border border-white/30">
                                <Shield size={8} />
                                АДМІН
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-1.5">
                        <Link
                          to={`/profile/${user.id}`}
                          onClick={() => setShowUserMenu(false)}
                          className="group w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-azure-blue/5 hover:text-azure-blue rounded-lg transition-all duration-200 flex items-center gap-2.5 relative"
                        >
                          <div className="w-8 h-8 bg-azure-blue/10 rounded-lg flex items-center justify-center group-hover:bg-azure-blue/20 transition-colors">
                            <User size={16} className="text-azure-blue" strokeWidth={2} />
                          </div>
                          <span className="flex-1">Моя сторінка</span>
                          {friendRequestsCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-vibrant-yellow text-gray-900 text-[10px] font-bold rounded-full shadow-sm">
                              {friendRequestsCount}
                            </span>
                          )}
                        </Link>
                        
                        <Link
                          to="/messages"
                          onClick={() => setShowUserMenu(false)}
                          className="group w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-azure-blue/5 hover:text-azure-blue rounded-lg transition-all duration-200 flex items-center gap-2.5 relative mt-0.5"
                        >
                          <div className="relative w-8 h-8 bg-azure-blue/10 rounded-lg flex items-center justify-center group-hover:bg-azure-blue/20 transition-colors">
                            <MessageSquare size={16} className="text-azure-blue" strokeWidth={2} />
                            {unreadMessagesCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                                <span className="text-white text-[8px] font-bold">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
                              </span>
                            )}
                          </div>
                          <span className="flex-1">Повідомлення</span>
                        </Link>
                        
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="group w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-azure-blue/5 hover:text-azure-blue rounded-lg transition-all duration-200 flex items-center gap-2.5 mt-0.5"
                        >
                          <div className="w-8 h-8 bg-azure-blue/10 rounded-lg flex items-center justify-center group-hover:bg-azure-blue/20 transition-colors">
                            <Settings size={16} className="text-azure-blue" strokeWidth={2} />
                          </div>
                          <span className="flex-1">Налаштування</span>
                        </Link>
                        
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="group w-full px-3 py-2 text-left text-xs font-semibold text-vibrant-yellow hover:bg-vibrant-yellow/10 rounded-lg transition-all duration-200 flex items-center gap-2.5 mt-0.5"
                          >
                            <div className="w-8 h-8 bg-vibrant-yellow/20 rounded-lg flex items-center justify-center group-hover:bg-vibrant-yellow/30 transition-colors">
                              <Shield size={16} className="text-vibrant-yellow" strokeWidth={2} />
                            </div>
                            <span className="flex-1">Адмін-панель</span>
                          </Link>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="px-3 py-1.5">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                      </div>

                      {/* Logout Button - Ukrainian Style */}
                      <div className="p-1.5 pb-2.5">
                        <button
                          onClick={handleLogout}
                          className="group w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center gap-2.5"
                        >
                          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <LogOut size={16} className="text-red-600" strokeWidth={2} />
                          </div>
                          <span className="flex-1">Вийти</span>
                          <span className="text-red-400 group-hover:text-red-600 transition-colors">→</span>
                        </button>
                      </div>

                      {/* Ukrainian Flag Footer */}
                      <div className="px-3 py-1.5 bg-gradient-to-r from-azure-blue/5 via-vibrant-yellow/5 to-azure-blue/5 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                          <Heart size={10} className="text-red-500 fill-red-500" />
                          <span>Наш дім Берлін</span>
                          <span className="text-azure-blue">🇺🇦</span>
                        </div>
                      </div>
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
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-azure-blue text-white rounded-lg md:rounded-xl font-semibold text-xs md:text-sm shadow-lg hover:shadow-xl transition-all"
              >
                <LogIn size={16} className="md:w-5 md:h-5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Увійти</span>
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
