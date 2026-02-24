import { motion, AnimatePresence } from 'framer-motion';
import { Home, Briefcase, Building2, MessageCircle, MessageSquare, BookOpen, LogIn, LogOut, User, Users, Shield, Bell, Settings, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase, updateLastSeen, getFriendRequests, getUnreadMessagesCount, ensureProfile } from '../lib/supabase';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

// ADMIN EMAIL - замініть на ваш реальний email
const ADMIN_EMAILS = [
  'andrefilipoua@gmail.com',
  'test@example.com',
  'admin@berlin-app.com',
];

const navItems = [
  { path: '/', label: 'Головна', icon: Home, color: 'primary' },
  { path: '/jobs', label: 'Вакансії', icon: Briefcase, color: 'primary' },
  { path: '/housing', label: 'Житло', icon: Building2, color: 'primary' },
  { path: '/services', label: 'Послуги', icon: BookOpen, color: 'primary' },
  { path: '/community', label: 'Спільнота', icon: Users, color: 'primary' },
  { path: '/chat', label: 'Чат', icon: MessageSquare, color: 'primary' },
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

  const loadProfile = async (userId, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        return;
      }
      
      // Якщо профілю немає, намагаємося створити його
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) return;
      
      const { ok } = await ensureProfile({
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Користувач',
        gender: user.user_metadata?.gender || null,
      });
      
      if (ok) {
        // Невелика затримка для синхронізації бази даних
        await new Promise(resolve => setTimeout(resolve, 300));
        const { data: next } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (next) {
          setProfile(next);
        } else if (retryCount < 2) {
          // Retry ще раз, якщо профіль ще не з'явився
          setTimeout(() => loadProfile(userId, retryCount + 1), 500);
        }
      }
    } catch (e) {
      console.error('Error loading profile:', e);
      // Retry при помилці, якщо ще не перевищено ліміт
      if (retryCount < 2) {
        setTimeout(() => loadProfile(userId, retryCount + 1), 500);
      }
    }
  };

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
          console.warn('⚠️ Channel subscription error (will retry):', err || 'Unknown error');
          // Retry subscription after a delay
          setTimeout(() => {
            if (channel) channel.subscribe();
          }, 5000);
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Channel subscription timed out (will retry)');
          setTimeout(() => {
            if (channel) channel.subscribe();
          }, 5000);
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

  const handleLogout = async () => {
    console.log('🚪 Logout initiated...');
    setShowUserMenu(false);
    
    try {
      // Перевіряємо чи є сесія перед signOut
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('2️⃣ Signing out from Supabase...');
        const { error } = await supabase.auth.signOut();
        if (error && !error.message?.includes('session missing')) {
          console.warn('⚠️ SignOut error (non-critical):', error);
        } else {
          console.log('✅ Supabase signOut successful');
        }
      } else {
        console.log('ℹ️ No active session, skipping signOut');
      }
    } catch (signOutError) {
      // Ігноруємо помилки signOut (сесія могла вже закінчитись)
      console.warn('⚠️ SignOut attempt failed (continuing anyway):', signOutError?.message);
    }
    
    // Завжди очищаємо стан та сховище
    try {
      setUser(null);
      setProfile(null);
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ State and storage cleared');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
    
    // Перенаправляємо на головну
    window.location.replace('/');
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
      'primary': {
        bg: 'bg-primary',
        text: 'text-primary'
      },
      'azure-blue': {
        bg: 'bg-primary',
        text: 'text-primary'
      },
      'vibrant-yellow': {
        bg: 'bg-accent',
        text: 'text-accent'
      }
    };
    const colors = colorMap[color] || colorMap['primary'];
    return colors[type];
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100/50 shadow-sm"
      >
        <div className="max-w-[1600px] mx-auto px-3 md:px-6">
          <div className="h-14 md:h-16 flex items-center justify-between gap-2 md:gap-4">
            {/* Mobile Logo / Title (Visible only on mobile) */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-azure-blue rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">DimBerlin</span>
            </div>

            {/* Desktop Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1.5 md:gap-3 lg:gap-4 flex-1 justify-center px-2">
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
                    <div className="w-7 h-7 md:w-9 md:h-9 bg-primary/10 rounded-full flex items-center justify-center shadow-sm border border-primary/10">
                      <span className="text-primary font-bold text-xs md:text-sm">
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
                        <div className="relative bg-white p-3 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
                              <span className="text-primary font-bold text-base">
                                {getUserInitial()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-extrabold text-gray-900 truncate">
                                {profile?.full_name || user?.email?.split('@')[0] || 'Користувач'}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                {user.email}
                              </p>
                              {isAdmin && (
                                <span className="inline-flex items-center gap-0.5 mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full border border-primary/20">
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
                            className="group w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-all duration-200 flex items-center gap-2.5 relative"
                          >
                            <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <User size={16} className="text-primary/70 group-hover:text-primary" strokeWidth={2} />
                            </div>
                            <span className="flex-1">Моя сторінка</span>
                            {friendRequestsCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-accent text-gray-900 text-[10px] font-bold rounded-full shadow-sm">
                                {friendRequestsCount}
                              </span>
                            )}
                          </Link>
                          
                          <Link
                            to="/messages"
                            onClick={() => setShowUserMenu(false)}
                            className="group w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-all duration-200 flex items-center gap-2.5 relative mt-0.5"
                          >
                            <div className="relative w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <MessageSquare size={16} className="text-primary/70 group-hover:text-primary" strokeWidth={2} />
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
                            className="group w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-all duration-200 flex items-center gap-2.5 mt-0.5"
                          >
                            <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Settings size={16} className="text-primary/70 group-hover:text-primary" strokeWidth={2} />
                            </div>
                            <span className="flex-1">Налаштування</span>
                          </Link>
                          
                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setShowUserMenu(false)}
                              className="group w-full px-3 py-2 text-left text-xs font-semibold text-accent hover:bg-accent/10 rounded-lg transition-all duration-200 flex items-center gap-2.5 mt-0.5"
                            >
                              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                                <Shield size={16} className="text-accent" strokeWidth={2} />
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
                        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                            <Heart size={10} className="text-red-500 fill-red-500" />
                            <span>Наш дім Берлін</span>
                            <span className="text-primary">🇺🇦</span>
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
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-primary text-white rounded-lg md:rounded-xl font-semibold text-xs md:text-sm shadow-sm hover:shadow-md hover:bg-blue-800 transition-all"
                >
                  <LogIn size={16} className="md:w-5 md:h-5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Увійти</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-between items-center px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/' 
              ? location.pathname === '/'
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const activeTextColor = getActiveColor(item.color, 'text');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center w-full"
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                  <Icon 
                    size={24} 
                    className={`transition-colors ${
                      isActive 
                        ? activeTextColor
                        : 'text-gray-400'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={`text-[10px] leading-none mt-1 transition-colors font-medium ${
                  isActive 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
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
    </>
  );
}
