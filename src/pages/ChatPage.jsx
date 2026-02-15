import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader2, Users, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, getMessages, getMessagesPage, sendMessage, deleteMessage } from '../lib/supabase';
import GuestGuard from '../components/GuestGuard';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import UserProfileModal from '../components/UserProfileModal';

const ADMIN_EMAILS = ['andrefilipoua@gmail.com', 'test@example.com', 'admin@berlin-app.com'];

export default function ChatPage() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showGuestGuard, setShowGuestGuard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [typingBot, setTypingBot] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const channelRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const realtimeRetryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const isInitialLoadRef = useRef(true);
  const oldestLoadedAtRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const PAGE_SIZE = 30;

  // Боти завжди онлайн
  const STATIC_BOTS = [
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Андрій Ші 🤖',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200'
    },
    {
      user_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Танюша Ші 🌸',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200'
    }
  ];

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

    const run = async () => {
      try {
        await Promise.race([
          (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            if (cancelled) return;
            setUser(currentUser);

            if (!currentUser) {
              setLoading(false);
              setShowGuestGuard(true);
              return;
            }

            await loadProfile(currentUser.id);
            if (cancelled) return;
            await loadMessages();
          })(),
          timeout(12000),
        ]);
      } catch (e) {
        if (cancelled) return;
        console.warn('Chat init error or timeout:', e);
        setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    const safety = setTimeout(() => {
      if (!cancelled) setLoading((prev) => (prev ? false : prev));
    }, 15000);

    return () => {
      cancelled = true;
      clearTimeout(safety);
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Встановлюємо початкових ботів як онлайн
    setOnlineUsers(STATIC_BOTS);
    setOnlineCount(STATIC_BOTS.length);
  }, []);

  const updateOnlineUsers = (realtimeUsers) => {
    // Об'єднуємо реальних користувачів і статичних ботів
    // Deduplicate users by user_id to avoid "same key" warnings
    const uniqueUsersMap = new Map();
    
    // Add realtime users
    realtimeUsers.forEach(u => {
      if (u.user_id) uniqueUsersMap.set(u.user_id, u);
    });
    
    // Add bots if not present
    STATIC_BOTS.forEach(bot => {
      if (!uniqueUsersMap.has(bot.user_id)) {
        uniqueUsersMap.set(bot.user_id, bot);
      }
    });

    const allUsers = Array.from(uniqueUsersMap.values());
    setOnlineUsers(allUsers);
    setOnlineCount(allUsers.length);
  };

  // Real-time підписка тільки для авторизованих; обмеження ретраїв
  useEffect(() => {
    if (!user?.id) return;

    realtimeRetryCountRef.current = 0;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = setupRealtimeChannel(user);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        // Видаляємо presence перед видаленням каналу
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, profile?.full_name]);

  // Оновлюємо presence коли змінюється профіль
  useEffect(() => {
    if (!user?.id || !channelRef.current) return;
    
    const updatePresence = async () => {
      await channelRef.current.track({
        user_id: user.id,
        full_name: profile?.full_name || user.email?.split('@')[0] || 'Користувач',
        avatar_url: profile?.avatar_url || null,
        online_at: new Date().toISOString(),
      });
    };
    
    updatePresence();
  }, [profile?.full_name, profile?.avatar_url, user?.id]);
  
  // Оновлюємо presence коли змінюється профіль
  useEffect(() => {
    if (channelRef.current && user?.id && profile?.full_name) {
      channelRef.current.track({
        user_id: user.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url || null,
        online_at: new Date().toISOString(),
      });
    }
  }, [profile?.full_name, profile?.avatar_url, user?.id]);

  useEffect(() => {
    // Використовуємо розумний scroll
    smartScrollToBottom();
  }, [messages]);

  // Прокручуємо вгору при завантаженні сторінки чату або переході на неї
  useEffect(() => {
    // Встановлюємо прапорець, що це початкове завантаження
    isInitialLoadRef.current = true;
    
    // Прокручуємо window вгору одразу
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Невелика затримка для того, щоб контейнер встиг відрендеритися
    const timer = setTimeout(() => {
      // Прокручуємо контейнер повідомлень вгору (якщо він існує)
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0;
        console.log('✅ Scrolled chat container to top');
      } else {
        console.log('⚠️ messagesContainerRef.current is null');
      }
      
      // Після прокрутки вгору, через деякий час скидаємо прапорець
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 1000);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]); // При зміні маршруту

  // Закриваємо emoji picker при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const loadProfile = async (userId) => {
    try {
      console.log('👤 Loading user profile...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading profile:', error);
        return;
      }

      if (data) {
        console.log('✅ Profile loaded:', {
          full_name: data.full_name || '(not set)',
          district: data.district || '(not set)',
          is_admin: data.is_admin || false,
        });
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ Exception loading profile:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
      const messagesData = await Promise.race([getMessagesPage({ limit: PAGE_SIZE }), timeout(10000)]);
      
      if (!Array.isArray(messagesData)) {
        setMessages([]);
        return;
      }
      
      // Завантажуємо профілі для всіх повідомлень
      const userIds = [...new Set(messagesData.map(m => m.user_id).filter(Boolean))];
      const profilesMap = new Map();
      
      if (userIds.length > 0) {
        try {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, district, is_admin')
            .in('id', userIds);
          
          if (profilesData) {
            profilesData.forEach(p => profilesMap.set(p.id, p));
          }
        } catch (profileError) {
          console.warn('Error loading profiles for messages:', profileError);
        }
      }
      
      // Додаємо профілі до повідомлень
      const messagesWithProfiles = messagesData.map(msg => {
        const profile = profilesMap.get(msg.user_id);
        return {
          ...msg,
          profiles: profile || null
        };
      });
      
      console.log('✅ Messages loaded with profiles:', messagesWithProfiles.length, 'messages');
      
      oldestLoadedAtRef.current = messagesWithProfiles.length > 0 ? messagesWithProfiles[0].created_at : null;
      setHasMore(messagesData.length === PAGE_SIZE);
      setMessages(messagesWithProfiles);
      setTimeout(() => scrollToBottom(), 300);
    } catch (e) {
      console.warn('loadMessages error or timeout:', e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMore || !oldestLoadedAtRef.current) return;
    setLoadingOlder(true);
    const container = messagesContainerRef.current;
    const prevHeight = container ? container.scrollHeight : 0;
    const prevTop = container ? container.scrollTop : 0;
    try {
      const older = await getMessagesPage({ limit: PAGE_SIZE, before: oldestLoadedAtRef.current });
      if (!Array.isArray(older) || older.length === 0) {
        setHasMore(false);
        return;
      }
      const userIds = [...new Set(older.map(m => m.user_id).filter(Boolean))];
      const profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, district, is_admin')
          .in('id', userIds);
        if (profilesData) {
          profilesData.forEach(p => profilesMap.set(p.id, p));
        }
      }
      const olderWithProfiles = older.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id) || null
      }));
      oldestLoadedAtRef.current = olderWithProfiles[0].created_at;
      setHasMore(older.length === PAGE_SIZE);
      setMessages(prev => [...olderWithProfiles, ...prev]);
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const newHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newHeight - prevHeight + prevTop;
        }
      }, 10);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (el.scrollTop < 40) {
      loadOlderMessages();
    }
  };

  const setupRealtimeChannel = (currentUser) => {
    console.log('📡 Setting up real-time channel for:', currentUser?.id);
    
    const channel = supabase
      .channel('public:messages', {
        config: {
          broadcast: { self: false },
          presence: { 
            key: currentUser?.id,
            events: {
              join: true,
              leave: true,
            }
          },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('🔥🔥🔥 НОВЕ ПОВІДОМЛЕННЯ ОТРИМАНО:', payload.new);
          
          if (payload.new.user_id === currentUser?.id) {
            console.log('💡 Своє повідомлення, оновлюємо ID...');
            setMessages(prev => {
              const hasOptimistic = prev.some(m => m._optimistic && m.content === payload.new.content);
              if (hasOptimistic) {
                return prev.map(msg => 
                  msg._optimistic && msg.content === payload.new.content
                    ? { ...msg, id: payload.new.id, _optimistic: false }
                    : msg
                );
              }
              return prev;
            });
            return;
          }
          
          console.log('👥 Чуже повідомлення - завантажуємо дані автора...');
          
          try {
            // Отримуємо дані профілю
            const { data: profileData, error: pError } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, district, is_admin')
              .eq('id', payload.new.user_id)
              .maybeSingle();
            
            if (pError) console.error('❌ Помилка завантаження профілю автора:', pError);

            let replyData = null;
            if (payload.new.reply_to_id) {
              const { data: reply } = await supabase
                .from('messages')
                .select('id, author_name, content')
                .eq('id', payload.new.reply_to_id)
                .single();
              replyData = reply;
            }
            
            const fullMessage = {
              ...payload.new,
              profiles: profileData,
              reply_to: replyData,
            };
            
            setMessages(prev => {
              if (prev.some(m => m.id === fullMessage.id)) return prev;
              const newList = [...prev, fullMessage];
              // Сортуємо за часом на випадок затримок мережі
              return newList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            });
            
            setTimeout(() => scrollToBottom(), 200);
          } catch (error) {
            console.error('❌ Помилка обробки Realtime:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🗑️ Видалення через Realtime:', payload.old.id);
          setMessages(current => current.filter(m => m.id !== payload.old.id));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        updateOnlineUsers(users);
        console.log('👥 Online users:', users.length, users);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('👋 User joined:', key);
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        updateOnlineUsers(users);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('👋 User left:', key);
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        updateOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          realtimeRetryCountRef.current = 0;
          // Відправляємо presence після підписки
          await channel.track({
            user_id: currentUser?.id,
            full_name: profile?.full_name || currentUser?.email?.split('@')[0] || 'Користувач',
            avatar_url: profile?.avatar_url || null,
            online_at: new Date().toISOString(),
          });
        }
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && mountedRef.current) {
          const n = realtimeRetryCountRef.current + 1;
          realtimeRetryCountRef.current = n;
          if (n <= 3) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
              }
              channelRef.current = setupRealtimeChannel(currentUser);
            }, 5000);
          }
        }
      });

    return channel;
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  const triggerAutoReply = async (message, authorName, messageId, replyToAuthor) => {
    const BOT_CONFIG = {
      ANDRIY: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Андрій Ші 🤖',
        keywords: ['машина', 'авто', 'робота', 'дозвіл', 'документи', 'ремонт', 'техніка', 'айті', 'it', 'комп', 'драйвер', 'права', 'пиво', 'бар', 'футбол', 'спорт']
      },
      TANYUSHA: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Танюша Ші 🌸',
        keywords: ['дитина', 'діти', 'лікар', 'школа', 'садок', 'сумно', 'депресія', 'порадьте', 'краса', 'манікюр', 'кафе', 'ресторан', 'їжа', 'ліки', 'питання', 'допомога', 'хтось', 'живий', 'ау', 'підкажіть', 'знає']
      }
    };

    // 1. Analyze inputs
    const lowerMsg = message.toLowerCase();
    const isAndriyKeyword = BOT_CONFIG.ANDRIY.keywords.some(k => lowerMsg.includes(k));
    const isTanyushaKeyword = BOT_CONFIG.TANYUSHA.keywords.some(k => lowerMsg.includes(k));
    
    // Greeting detection
    const isGreeting = (lowerMsg.includes('привіт') || lowerMsg.includes('вітаю') || lowerMsg.includes('добр')) && 
                       (lowerMsg.includes('всім') || lowerMsg.includes('усім') || lowerMsg.includes('всіх') || lowerMsg.includes('народ') || lowerMsg.includes('хтось') || lowerMsg.includes('люди'));

    // Mention detection
    const mentionsAndriy = lowerMsg.includes('андрій') || lowerMsg.includes('andriy');
    const mentionsTanyusha = lowerMsg.includes('танюша') || lowerMsg.includes('таня') || lowerMsg.includes('tanyusha') || lowerMsg.includes('тання');

    // Context detection (Last message author)
    // Find the last bot that spoke in the last 10 messages
    let lastBotSpeaker = null;
    if (messages.length > 0) {
      // Look back up to 10 messages
      const recentMessages = messages.slice(-10).reverse();
      for (const msg of recentMessages) {
        if (msg.user_id === BOT_CONFIG.ANDRIY.id) {
          lastBotSpeaker = BOT_CONFIG.ANDRIY.name;
          break;
        }
        if (msg.user_id === BOT_CONFIG.TANYUSHA.id) {
          lastBotSpeaker = BOT_CONFIG.TANYUSHA.name;
          break;
        }
        // If we hit a message from another user (not current user and not bot), maybe break context? 
        // For now, let's keep it sticky to the bot if the bot spoke recently.
      }
    }

    let botName = null;

    // PRIORITY LOGIC:
    
    // 1. Explicit Mentions (Highest Priority) - Overrides everything
    if (mentionsAndriy) botName = BOT_CONFIG.ANDRIY.name;
    else if (mentionsTanyusha) botName = BOT_CONFIG.TANYUSHA.name;
    
    // 2. Reply To Specific Bot (UI Reply)
    else if (replyToAuthor === BOT_CONFIG.ANDRIY.name) botName = BOT_CONFIG.ANDRIY.name;
    else if (replyToAuthor === BOT_CONFIG.TANYUSHA.name) botName = BOT_CONFIG.TANYUSHA.name;

    // 3. Conversation Context (Last Speaker) - "Sticky" bot
    // Only applies if no other strong signal contradicts it (e.g. greeting everyone)
    // AND message doesn't say "not you"
    else if (lastBotSpeaker && !isGreeting) {
       const isNegative = lowerMsg.includes('не тобі') || lowerMsg.includes('не тебе');
       if (!isNegative) {
          botName = lastBotSpeaker;
       }
    }

    // 4. Greeting -> Tanyusha
    else if (isGreeting) botName = BOT_CONFIG.TANYUSHA.name;
    
    // 5. Keywords
    else if (isAndriyKeyword && !isTanyushaKeyword) botName = BOT_CONFIG.ANDRIY.name;
    else if (isTanyushaKeyword && !isAndriyKeyword) botName = BOT_CONFIG.TANYUSHA.name;
    else if (isAndriyKeyword && isTanyushaKeyword) botName = Math.random() > 0.5 ? BOT_CONFIG.ANDRIY.name : BOT_CONFIG.TANYUSHA.name;
    
    // If no bot selected, DO NOT REPLY
    if (!botName) return;

    // 2. Show typing indicator
    setTypingBot(botName);

    // 3. Wait 3-6 seconds (random)
    const delay = 3000 + Math.random() * 3000;
    await new Promise(r => setTimeout(r, delay));

    // 4. Call API
    try {
      await fetch('/api/chat/auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: user.id,
          userName: authorName,
          type: 'chat',
          messageId: messageId,
          replyToAuthor: replyToAuthor // Pass who we are replying to
        })
      });
    } catch (e) {
      console.error('Auto-reply failed:', e);
    } finally {
      setTypingBot(null);
    }
  };

  const handleSendMessage = async () => {
    console.log('📤 Attempting to send message...');
    
    if (!messageText.trim()) {
      console.warn('⚠️ Message text is empty');
      return;
    }
    
    if (!user) {
      console.error('❌ User is not authenticated');
      alert('Ви не авторизовані. Будь ласка, увійдіть в систему.');
      return;
    }

    const messageContent = messageText.trim();
    const authorName = profile?.full_name || user.email?.split('@')[0] || 'Гість';
    
    // Створюємо optimistic повідомлення для миттєвого відображення
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Тимчасовий ID
      user_id: user.id,
      author_name: authorName,
      content: messageContent,
      created_at: new Date().toISOString(),
      reply_to_id: replyTo?.id || null,
      reply_to: replyTo ? {
        id: replyTo.id,
        author_name: replyTo.author,
        content: replyTo.content,
      } : null,
      profiles: profile ? {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        district: profile.district,
        is_admin: profile.is_admin,
      } : null,
      _optimistic: true, // Позначка що це optimistic update
    };

    try {
      setSending(true);
      
      console.log('💡 Adding optimistic message to UI...');
      // Додаємо повідомлення ОДРАЗУ в UI (optimistic update)
      setMessages(prev => [...prev, optimisticMessage]);
      setMessageText('');
      setReplyTo(null); // Очищаємо reply
      
      // Прокручуємо вниз
      setTimeout(() => scrollToBottom(), 50);
      
      const messageData = {
        user_id: user.id,
        author_name: authorName,
        content: messageContent,
        reply_to_id: replyTo?.id || null,
      };
      
      console.log('📝 Message data to send:', {
        user_id: messageData.user_id,
        author_name: messageData.author_name,
        content_length: messageData.content.length,
      });
      
      console.log('🚀 Sending to Supabase...');
      const result = await sendMessage(messageData);
      console.log('✅ Message sent successfully!', result);
      
      // Замінюємо тимчасове повідомлення на реальне з ID від бази
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...result, profiles: optimisticMessage.profiles, _optimistic: false }
            : msg
        )
      );

      // Trigger Auto Reply (fire and forget)
      triggerAutoReply(messageContent, authorName, result.id, replyTo?.author);
      
    } catch (error) {
      console.error('❌ ERROR SENDING MESSAGE:');
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      
      // При помилці - видаляємо optimistic повідомлення
      console.log('🗑️ Removing optimistic message due to error...');
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      alert(`Помилка при відправці повідомлення:\n${error.message}\n\nПеревірте Console (F12) для деталей.`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Видалити це повідомлення?')) return;

    // Зберігаємо повідомлення для можливого rollback
    const messageToDelete = messages.find(m => m.id === messageId);
    if (!messageToDelete) return;

    try {
      setDeletingMessageId(messageId);
      
      console.log('🗑️ Optimistic delete - removing from UI...');
      // Optimistic delete - видаляємо одразу з UI
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      console.log('🚀 Deleting from Supabase...');
      await deleteMessage(messageId);
      console.log('✅ Message deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      
      // Rollback - повертаємо повідомлення на місце
      console.log('↩️ Rolling back delete...');
      setMessages(prev => {
        const newMessages = [...prev, messageToDelete];
        // Сортуємо по created_at щоб повернути на правильне місце
        return newMessages.sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
      });
      
      alert('Помилка при видаленні повідомлення');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleReply = (message) => {
    console.log('💬 Reply to message:', message.id);
    setReplyTo({
      id: message.id,
      author: getAuthorName(message),
      content: message.content,
    });
    // Фокус на поле вводу
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleEmojiClick = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false); // Закриваємо picker після вибору
    inputRef.current?.focus();
  };

  const isScrolledToBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // 100px від низу вважається "внизу"
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const smartScrollToBottom = () => {
    // Якщо це початкове завантаження сторінки, не прокручуємо вниз
    if (isInitialLoadRef.current) {
      return;
    }
    
    // Якщо повідомлень мало або користувач і так внизу — скролимо
    if (isScrolledToBottom() || messages.length <= 1) {
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'щойно';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} хв`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} год`;
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  };

  const getUserInitial = (message) => {
    // Пріоритет: full_name з профілю → author_name → 'Гість'
    const name = message.profiles?.full_name || message.author_name || 'Гість';
    return name.charAt(0).toUpperCase();
  };

  const getAuthorName = (message) => {
    // Пріоритет: full_name з профілю → author_name → 'Гість'
    return message.profiles?.full_name || message.author_name || 'Гість';
  };

  const getAuthorDistrict = (message) => {
    // Повертає район якщо є в profiles
    return message.profiles?.district || null;
  };

  const isMyMessage = (message) => {
    return user && message.user_id === user.id;
  };

  const isAdmin = () => {
    return profile?.is_admin || (user && ADMIN_EMAILS.includes(user.email));
  };

  const canDeleteMessage = (message) => {
    return isMyMessage(message) || isAdmin();
  };

  const handleProfileClick = (userId) => {
    if (!user) {
      setShowGuestGuard(true);
      return;
    }
    setSelectedUserId(userId);
    setShowUserModal(true);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col h-[calc(100vh-130px)] md:h-[calc(100vh-64px)]" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg border-b border-white/50 shadow-lg p-4 flex-shrink-0 z-10"
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-azure-blue to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Чат спільноти</h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Users size={14} />
                  {onlineCount} онлайн
                </p>
                {onlineUsers.length > 0 && (
                  <div className="flex items-center gap-1">
                    {onlineUsers.slice(0, 3).map((presence, idx) => (
                      <button
                        key={presence.user_id || idx}
                        onClick={() => handleProfileClick(presence.user_id)}
                        className="w-6 h-6 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center hover:scale-105 transition-transform"
                        title={presence.full_name || 'Користувач'}
                      >
                        {presence.avatar_url ? (
                          <img 
                            src={presence.avatar_url} 
                            alt={presence.full_name || 'Avatar'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-azure-blue to-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {(presence.full_name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                    {onlineUsers.length > 3 && (
                      <span className="text-xs text-gray-500 ml-1">+{onlineUsers.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {profile && (
            <button
              onClick={() => handleProfileClick(user.id)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              {profile.avatar_url ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'Avatar'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-vibrant-yellow to-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {profile.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-semibold text-gray-900 hidden md:block">
                {profile.full_name || user.email?.split('@')[0] || 'Гість'}
              </span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Messages - фіксована висота з прокруткою */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: '1 1 auto', minHeight: 0 }}>
        <div className="max-w-[1200px] mx-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={48} className="text-azure-blue animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Поки що нічого немає</p>
                <p className="text-sm text-gray-400 mt-1">Напишіть перше повідомлення!</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMine = isMyMessage(message);
              const canDelete = canDeleteMessage(message);
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ 
                    delay: Math.min(index * 0.01, 0.2),
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Clickable Avatar */}
                    <button
                      onClick={() => handleProfileClick(message.user_id)}
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {(() => {
                        const avatarUrl = message.profiles?.avatar_url || message.avatar_url;
                        if (avatarUrl) {
                          return (
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                              <img 
                                src={avatarUrl} 
                                alt={getAuthorName(message)} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Якщо зображення не завантажилось, показуємо placeholder
                                  e.target.style.display = 'none';
                                  const placeholder = document.createElement('div');
                                  placeholder.className = `w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                                    isMine
                                      ? 'bg-gradient-to-br from-vibrant-yellow to-orange-400'
                                      : 'bg-gradient-to-br from-azure-blue to-blue-600'
                                  }`;
                                  placeholder.innerHTML = `<span class="text-white font-bold text-sm">${getUserInitial(message)}</span>`;
                                  e.target.parentElement.replaceWith(placeholder);
                                }}
                              />
                            </div>
                          );
                        }
                        return (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                            isMine
                              ? 'bg-gradient-to-br from-vibrant-yellow to-orange-400'
                              : 'bg-gradient-to-br from-azure-blue to-blue-600'
                          }`}>
                            <span className="text-white font-bold text-sm">
                              {getUserInitial(message)}
                            </span>
                          </div>
                        );
                      })()}
                    </button>

                    {/* Message Bubble */}
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                      {/* Author Info */}
                      <div className={`flex items-baseline gap-x-2 flex-wrap mb-0 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <button
                          onClick={() => handleProfileClick(message.user_id)}
                          className="text-[11px] font-bold text-gray-700 hover:text-azure-blue transition-colors whitespace-nowrap"
                        >
                          {getAuthorName(message)}
                        </button>
                        {getAuthorDistrict(message) && (
                          <span className="text-[10px] text-gray-400 font-normal truncate max-w-[120px]">
                            {getAuthorDistrict(message)}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {getTimeAgo(message.created_at)}
                        </span>
                      </div>
                      
                      {/* Message Content */}
                      <div className={`flex items-start gap-1.5 w-full ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {isMine && canDelete && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={deletingMessageId === message.id}
                            className="mt-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                            title="Видалити повідомлення"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        
                        <div className="flex flex-col gap-1 w-full">
                          <div className={`px-3 py-2 rounded-2xl ${
                            isMine
                              ? 'bg-gradient-to-br from-azure-blue via-blue-500 to-blue-600 text-white rounded-br-md shadow-lg shadow-blue-500/30'
                              : 'bg-gradient-to-br from-white to-gray-50 text-gray-900 rounded-bl-md border border-gray-200 shadow-lg'
                          }`}>
                            {/* Reply Quote */}
                            {(message.reply_to || message.reply_to_id) && (
                              <div className={`mb-2 pb-2 border-l-4 pl-3 ${
                                isMine 
                                  ? 'border-white/40 bg-white/10' 
                                  : 'border-azure-blue/40 bg-azure-blue/5'
                              } rounded`}>
                                <p className={`text-xs font-semibold mb-1 ${isMine ? 'text-white/90' : 'text-azure-blue'}`}>
                                  {message.reply_to?.author_name || 'Відповідь'}
                                </p>
                                <p className={`text-xs ${isMine ? 'text-white/70' : 'text-gray-600'} line-clamp-2`}>
                                  {message.reply_to?.content || '...'}
                                </p>
                              </div>
                            )}
                            
                            {/* Message Text */}
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                          
                          {/* Reply Button */}
                          <button
                            onClick={() => handleReply(message)}
                            className={`text-xs px-2 py-1 rounded-lg transition-all self-start ${
                              isMine
                                ? 'text-gray-600 hover:text-azure-blue hover:bg-azure-blue/10'
                                : 'text-gray-600 hover:text-azure-blue hover:bg-azure-blue/10'
                            }`}
                            title="Відповісти"
                          >
                            💬 Відповісти
                          </button>
                        </div>
                        
                        {!isMine && canDelete && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={deletingMessageId === message.id}
                            className="mt-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                            title="Видалити повідомлення (Адмін)"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - зафіксована панель внизу */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg border-t border-white/50 shadow-lg p-4"
        style={{ flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 10 }}
      >
        <div className="max-w-[1200px] mx-auto">
          {/* Reply Banner */}
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 p-3 bg-azure-blue/10 border-l-4 border-azure-blue rounded-lg flex items-start justify-between"
            >
              <div className="flex-1">
                <p className="text-xs font-semibold text-azure-blue mb-1">
                  💬 Відповідь користувачу {replyTo.author}
                </p>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {replyTo.content}
                </p>
              </div>
              <button
                onClick={cancelReply}
                className="ml-2 p-1 hover:bg-red-100 rounded-lg transition-colors"
                title="Скасувати"
              >
                <span className="text-lg">✖️</span>
              </button>
            </motion.div>
          )}

          {/* Typing Indicator */}
          {typingBot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2 ml-4 flex items-center gap-2"
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
              <span className="text-xs text-gray-500 font-medium">{typingBot} пише...</span>
            </motion.div>
          )}


          {/* Input Field */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Напишіть повідомлення..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="w-full pl-6 pr-14 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-transparent text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue focus:bg-white transition-all shadow-inner"
                disabled={sending}
              />
              
              {/* Emoji Button - ВСЕРЕДИНІ поля вводу (абсолютне позиціювання) */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-200/50 rounded-full transition-all"
                  title="Емодзі"
                  type="button"
                >
                  <span className="text-xl leading-none">😀</span>
                </button>
              </div>

              {/* Emoji Picker Popover - Відкривається ВГОРУ над полем */}
              {showEmojiPicker && (
                <motion.div
                  ref={emojiPickerRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 grid grid-cols-6 gap-2 z-[100]"
                  style={{ width: '320px' }}
                >
                  <div className="col-span-6 text-xs text-gray-500 font-medium mb-1 text-center">
                    Виберіть емодзі:
                  </div>
                  {['😀', '😂', '🥰', '😍', '🤗', '🤔', '😎', '🥳', '😊', '😇', '🙂', '😉',
                    '❤️', '💙', '💛', '💚', '🧡', '💜', '🖤', '🤍', '💕', '💖', '✨', '⭐',
                    '👍', '👏', '🙏', '💪', '✌️', '🤝', '👋', '🙌', '🎉', '🎊', '🔥', '💯',
                    '🇺🇦', '🌍', '🌈', '☀️', '🌙', '⚡', '💫', '🌟'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-2xl hover:bg-azure-blue/10 rounded-lg p-2 transition-all hover:scale-125 active:scale-95"
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
              className="px-6 py-4 bg-gradient-to-r from-azure-blue via-blue-500 to-blue-600 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span className="hidden md:inline">Надсилання...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span className="hidden md:inline">Надіслати</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* User Profile Modal */}
      {showUserModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUserId(null);
          }}
        />
      )}

      {/* Guest Guard Modal - показується для неавторизованих користувачів */}
      {showGuestGuard && (
        <GuestGuard
          onClose={() => setShowGuestGuard(false)}
          onLogin={() => {
            setShowGuestGuard(false);
            setShowLoginModal(true);
          }}
          onRegister={() => {
            setShowGuestGuard(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
}
