import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader2, Users, ArrowLeft, User, UserCheck, UserX, Check, X, UserPlus, Trash2, Volume2, VolumeX, Lock, LogIn, MessageCircle, Search, CheckCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getConversations, getPrivateMessages, sendPrivateMessage, markMessageAsRead, getFriends, getFriendshipStatus, acceptFriendRequest, rejectFriendRequest, getBlockedUsers, sendFriendRequest, deletePrivateMessage } from '../lib/supabase';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

export default function MessagesPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [friendsConversations, setFriendsConversations] = useState([]);
  const [othersConversations, setOthersConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [onlineUsersMap, setOnlineUsersMap] = useState(new Map()); // Map userId -> last_seen
  const [isTyping, setIsTyping] = useState(false); // Чи друкує співрозмовник
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Завантажуємо налаштування з localStorage (за замовчуванням true)
    const saved = localStorage.getItem('messagesSoundEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const channelRef = useRef(null);
  const typingChannelRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingSentRef = useRef(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadBlockedUsers();
      loadConversations();
      if (userId) {
        setSelectedConversation({ user_id: userId });
        loadMessages(userId);
      } else {
        // Якщо userId немає, очищаємо вибрану розмову
        setSelectedConversation(null);
        setMessages([]);
      }
    }
  }, [currentUser?.id, userId]);

  const loadBlockedUsers = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await getBlockedUsers(currentUser.id);
      setBlockedUsers(data.map(b => b.blocked_user_id));
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  useEffect(() => {
    if (selectedConversation?.user_id && currentUser?.id) {
      loadMessages(selectedConversation.user_id);
      // Відмічаємо повідомлення як прочитані
      markAllAsRead(selectedConversation.user_id);
    }
  }, [selectedConversation?.user_id, currentUser?.id, blockedUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Polling як резервний механізм, якщо real-time не працює (для оновлення статусу прочитання)
  useEffect(() => {
    if (!currentUser?.id || !selectedConversation?.user_id) return;

    // Оновлюємо повідомлення кожні 2 секунди як резервний механізм
    // Це допомагає оновити статус прочитання, якщо real-time не спрацював
    const pollInterval = setInterval(async () => {
      try {
        const latestMessages = await getPrivateMessages(currentUser.id, selectedConversation.user_id);
        // Оновлюємо повідомлення, якщо змінився статус прочитання
        setMessages(prev => {
          // Перевіряємо, чи змінився статус прочитання для наших повідомлень
          const hasReadStatusChanged = prev.some(prevMsg => {
            if (prevMsg.sender_id !== currentUser.id) return false; // Тільки для наших повідомлень
            const latestMsg = latestMessages.find(m => m.id === prevMsg.id);
            return latestMsg && latestMsg.read !== prevMsg.read;
          });
          
          if (hasReadStatusChanged || prev.length !== latestMessages.length) {
            console.log('🔄 Polling detected changes, updating messages...');
            return latestMessages;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentUser?.id, selectedConversation?.user_id]);

  // Real-time підписка на typing indicator
  useEffect(() => {
    if (!currentUser?.id || !selectedConversation?.user_id) {
      setIsTyping(false);
      return;
    }

    console.log('⌨️ Setting up typing indicator subscription for conversation with:', selectedConversation.user_id);

    // Створюємо унікальний канал для цієї розмови (використовуємо менший ID першим для консистентності)
    const userIds = [currentUser.id, selectedConversation.user_id].sort();
    const channelName = `typing_${userIds[0]}_${userIds[1]}`;

    const typingChannel = supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          console.log('⌨️ Received typing event:', payload);
          // Перевіряємо, чи це від нашого співрозмовника
          const senderId = payload.payload?.userId;
          if (senderId === selectedConversation.user_id && senderId !== currentUser.id) {
            setIsTyping(true);
            // Приховуємо індикатор через 3 секунди після останнього сигналу
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'stop-typing' },
        (payload) => {
          console.log('⌨️ Received stop-typing event:', payload);
          const senderId = payload.payload?.userId;
          if (senderId === selectedConversation.user_id && senderId !== currentUser.id) {
            setIsTyping(false);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('⌨️ Typing channel status:', status);
      });

    typingChannelRef.current = typingChannel;

    return () => {
      console.log('🔌 Unsubscribing from typing channel');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      typingSentRef.current = false;
      supabase.removeChannel(typingChannel);
    };
  }, [currentUser?.id, selectedConversation?.user_id]);

  // Real-time оновлення повідомлень
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('🔔 Setting up real-time subscription for user:', currentUser.id);

    const channel = supabase
      .channel(`private_messages_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          console.log('📨 Received message (as receiver):', payload.new);
          
          // Перевіряємо, чи не заблокований відправник
          const isBlocked = blockedUsers.includes(payload.new.sender_id);
          if (isBlocked) {
            console.log('🚫 Message from blocked user, ignoring');
            return;
          }
          
          // Відтворюємо звуковий сигнал тільки якщо це НЕ поточна розмова
          // (щоб не дратувати користувача коли він вже читає повідомлення)
          const isCurrentConversation = selectedConversation?.user_id === payload.new.sender_id;
          if (!isCurrentConversation) {
            console.log('🔔 Playing notification sound for new message');
            playNotificationSound();
          }
          
          // Оновлюємо повідомлення, якщо це поточна розмова
          if (isCurrentConversation) {
            console.log('✅ Adding message to current conversation');
            setMessages(prev => {
              // Перевіряємо, чи повідомлення вже немає в списку
              const exists = prev.some(m => m.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
            // Прокручуємо вниз
            setTimeout(() => scrollToBottom(), 100);
          }
          // Оновлюємо список розмов
          await loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `sender_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          console.log('📤 Sent message (as sender):', payload.new);
          
          // Перевіряємо, чи не заблокований отримувач
          const isBlocked = blockedUsers.includes(payload.new.receiver_id);
          if (isBlocked) {
            console.log('🚫 Message to blocked user, ignoring');
            return;
          }
          
          // Оновлюємо повідомлення, якщо це поточна розмова
          if (selectedConversation?.user_id === payload.new.receiver_id) {
            console.log('✅ Adding sent message to current conversation');
            setMessages(prev => {
              // Перевіряємо, чи повідомлення вже немає в списку
              const exists = prev.some(m => m.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
            // Прокручуємо вниз
            setTimeout(() => scrollToBottom(), 100);
          }
          // Оновлюємо список розмов
          await loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'private_messages',
          filter: `sender_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('✅ Message read status updated via real-time:', payload.new);
          // Оновлюємо статус прочитання повідомлення в реальному часі
          // payload.new.receiver_id - це той, хто прочитав (той, хто відкрив розмову)
          // payload.new.sender_id - це поточний користувач (той, хто відправив)
          setMessages(prev => {
            const updated = prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, read: payload.new.read, read_at: payload.new.read_at }
                : msg
            );
            // Якщо повідомлення оновлено, перевіряємо чи це поточна розмова
            const messageUpdated = updated.some(msg => msg.id === payload.new.id && msg.read !== prev.find(m => m.id === payload.new.id)?.read);
            if (messageUpdated) {
              console.log('🔄 Message read status changed, updating UI');
            }
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'private_messages',
        },
        (payload) => {
          console.log('🗑️ Message deleted via real-time:', payload.old.id);
          // Видаляємо повідомлення зі списку
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          // Оновлюємо список розмов
          loadConversations();
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel subscription error:', err);
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Subscription timed out, retrying...');
          // Спробуємо перепідписатися через 2 секунди
          setTimeout(() => {
            if (channelRef.current) {
              channelRef.current.subscribe();
            }
          }, 2000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Unsubscribing from real-time updates');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, selectedConversation?.user_id, blockedUsers]);

  const loadCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
    setLoading(false);
  };

  const loadConversations = async () => {
    if (!currentUser?.id) return;
    try {
      console.log('🔄 Loading conversations for user:', currentUser.id);
      
      const friendsList = await getFriends(currentUser.id);
      console.log('👥 Friends list:', friendsList);
      
      // Створюємо Set з ID друзів (як рядки для безпечного порівняння)
      const friendIds = new Set(
        friendsList
          .map(f => {
            const id = f.friend_profile?.id;
            return id ? String(id) : null;
          })
          .filter(id => id !== null && id !== undefined)
      );
      
      console.log('✅ Friend IDs set:', Array.from(friendIds));
      
      // Отримуємо список заблокованих користувачів
      const blockedList = await getBlockedUsers(currentUser.id);
      const blockedIds = new Set(blockedList.map(b => b.blocked_user_id));
      
      // Отримуємо всі повідомлення (не тільки з друзями), але виключаємо заблокованих
      const { data: allMessages } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });
      
      if (!allMessages || allMessages.length === 0) {
        setFriendsConversations([]);
        setOthersConversations([]);
        setConversations([]);
        return;
      }
      
      // Фільтруємо повідомлення від заблокованих користувачів
      const filteredMessages = allMessages.filter(msg => {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        return !blockedIds.has(otherUserId);
      });
      
      // Отримуємо унікальні ID користувачів (без заблокованих)
      const userIds = new Set();
      filteredMessages.forEach(msg => {
        if (msg.sender_id !== currentUser.id) userIds.add(msg.sender_id);
        if (msg.receiver_id !== currentUser.id) userIds.add(msg.receiver_id);
      });
      
      // Отримуємо профілі користувачів
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, district, gender')
        .in('id', Array.from(userIds));
      
      const profilesMap = new Map();
      if (profiles) {
        profiles.forEach(p => profilesMap.set(p.id, p));
      }
      
      // Групуємо по користувачам
      const conversationsMap = new Map();
      
      filteredMessages.forEach(msg => {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        const profile = profilesMap.get(otherUserId) || { id: otherUserId, full_name: 'Користувач', district: null, gender: null };
        
        if (!conversationsMap.has(otherUserId)) {
          // Перевіряємо, чи користувач є другом (порівнюємо як рядки для безпеки)
          const otherUserIdStr = String(otherUserId);
          const isFriend = friendIds.has(otherUserIdStr);
          console.log(`🔍 User ${otherUserIdStr} (${profile.full_name}) is friend:`, isFriend, 'Friend IDs:', Array.from(friendIds));
          
          conversationsMap.set(otherUserId, {
            user_id: otherUserId,
            friend_profile: {
              id: profile.id,
              full_name: profile.full_name || 'Користувач',
              district: profile.district,
              gender: profile.gender
            },
            last_message: msg,
            unread_count: 0,
            is_friend: isFriend
          });
        } else {
          const existing = conversationsMap.get(otherUserId);
          // Оновлюємо останнє повідомлення, якщо це новіше
          if (new Date(msg.created_at) > new Date(existing.last_message.created_at)) {
            existing.last_message = msg;
          }
        }
      });
      
      // Підраховуємо непрочитані
      filteredMessages.forEach(msg => {
        if (msg.receiver_id === currentUser.id && !msg.read) {
          const conv = conversationsMap.get(msg.sender_id);
          if (conv) conv.unread_count++;
        }
      });
      
      const allConversations = Array.from(conversationsMap.values());
      
      // Розділяємо на категорії
      const friends = allConversations.filter(c => c.is_friend);
      const others = allConversations.filter(c => !c.is_friend);
      
      console.log('👥 Friends conversations:', friends.length, friends.map(c => c.friend_profile?.full_name));
      console.log('👤 Others conversations:', others.length, others.map(c => c.friend_profile?.full_name));
      
      setFriendsConversations(friends);
      setOthersConversations(others);
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (otherUserId) => {
    if (!currentUser?.id || !otherUserId) return;
    try {
      // Перевіряємо, чи не заблокований користувач
      const isBlocked = blockedUsers.includes(otherUserId);
      if (isBlocked) {
        setMessages([]);
        return;
      }
      
      console.log('📥 Loading messages for conversation with:', otherUserId);
      const data = await getPrivateMessages(currentUser.id, otherUserId);
      console.log(`✅ Loaded ${data.length} messages, read status:`, data.filter(m => m.sender_id === currentUser.id).map(m => ({ id: m.id, read: m.read })));
      setMessages(data);
      
      // Завантажуємо статус дружби
      await loadFriendshipStatus(otherUserId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadFriendshipStatus = async (otherUserId) => {
    if (!currentUser?.id || !otherUserId) return;
    try {
      const status = await getFriendshipStatus(currentUser.id, otherUserId);
      if (status) {
        // Визначаємо тип статусу
        const isPending = status.status === 'pending';
        const isAccepted = status.status === 'accepted';
        const isRejected = status.status === 'rejected';
        const isSent = status.user_id === currentUser.id;
        
        let normalizedStatus = 'none';
        if (isAccepted) {
          normalizedStatus = 'accepted';
        } else if (isPending && isSent) {
          normalizedStatus = 'pending_sent';
        } else if (isPending && !isSent) {
          normalizedStatus = 'pending_received';
        } else if (isRejected) {
          // Якщо запит був відхилений, можна відправити знову
          normalizedStatus = 'none';
        }
        
        setFriendshipStatus({
          ...status,
          status: normalizedStatus
        });
      } else {
        // Немає запису - можна відправити запит
        setFriendshipStatus({ status: 'none' });
      }
    } catch (error) {
      console.error('Error loading friendship status:', error);
      setFriendshipStatus({ status: 'none' });
    }
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser?.id || !selectedConversation?.user_id || sendingFriendRequest) return;
    
    try {
      setSendingFriendRequest(true);
      console.log('📤 Sending friend request to:', selectedConversation.user_id);
      
      await sendFriendRequest(currentUser.id, selectedConversation.user_id);
      
      // Оновлюємо статус дружби
      await loadFriendshipStatus(selectedConversation.user_id);
      
      // Оновлюємо список розмов
      await loadConversations();
      
      alert('Запит на дружбу відправлено!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Помилка при відправці запиту: ' + (error.message || 'Невідома помилка'));
    } finally {
      setSendingFriendRequest(false);
    }
  };

  const markAllAsRead = async (otherUserId) => {
    if (!currentUser?.id || !otherUserId) return;
    try {
      console.log('📖 Marking messages as read from user:', otherUserId);
      const { data } = await supabase
        .from('private_messages')
        .select('id')
        .eq('receiver_id', currentUser.id)
        .eq('sender_id', otherUserId)
        .eq('read', false);
      
      if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} unread messages, marking as read...`);
        await Promise.all(data.map(msg => markMessageAsRead(msg.id)));
        console.log('✅ All messages marked as read');
        loadConversations(); // Оновлюємо список розмов
      } else {
        console.log('ℹ️ No unread messages to mark');
      }
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  };

  const handleTyping = (text) => {
    if (!selectedConversation?.user_id || !currentUser?.id || !typingChannelRef.current) return;
    
    // Очищаємо попередній таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Якщо текст порожній, відправляємо stop-typing
    if (text.trim().length === 0) {
      handleStopTyping();
      return;
    }
    
    // Відправляємо сигнал "друкує" тільки якщо є текст і ми ще не відправили сигнал
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUser.id,
          conversationId: selectedConversation.user_id,
          timestamp: new Date().toISOString()
        }
      }).then(() => {
        console.log('⌨️ Typing signal sent');
      }).catch((error) => {
        console.error('⌨️ Error sending typing signal:', error);
      });
    }
    
    // Відправляємо stop-typing через 2 секунди після останнього введення
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (!selectedConversation?.user_id || !currentUser?.id || !typingChannelRef.current) return;
    
    if (typingSentRef.current) {
      typingSentRef.current = false;
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'stop-typing',
        payload: {
          userId: currentUser.id,
          conversationId: selectedConversation.user_id,
          timestamp: new Date().toISOString()
        }
      }).then(() => {
        console.log('⌨️ Stop-typing signal sent');
      }).catch((error) => {
        console.error('⌨️ Error sending stop-typing signal:', error);
      });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation?.user_id || !currentUser?.id || sending) return;
    
    // Перевіряємо, чи не заблокований користувач
    if (blockedUsers.includes(selectedConversation.user_id)) {
      alert('Цей користувач заблокований');
      return;
    }
    
    // Зупиняємо typing indicator перед відправкою
    handleStopTyping();
    
    try {
      setSending(true);
      const messageToSend = messageText.trim();
      setMessageText(''); // Очищаємо поле одразу для кращого UX
      
      // Відправляємо повідомлення
      const newMessage = await sendPrivateMessage(currentUser.id, selectedConversation.user_id, messageToSend);
      console.log('📤 Message sent successfully:', newMessage);
      
      // Додаємо повідомлення миттєво до списку (якщо real-time ще не спрацював)
      setMessages(prev => {
        // Перевіряємо, чи повідомлення вже немає (якщо прийшло через real-time)
        const exists = prev.some(m => m.id === newMessage.id);
        if (exists) {
          console.log('⚠️ Message already exists (from real-time), skipping');
          return prev;
        }
        console.log('✅ Adding message to list immediately');
        return [...prev, newMessage];
      });
      
      // Оновлюємо список розмов
      await loadConversations();
      
      // Прокручуємо вниз
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Повертаємо текст назад при помилці
      setMessageText(messageToSend);
      alert(error.message || 'Помилка при відправці повідомлення');
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
      await deletePrivateMessage(messageId);
      console.log('✅ Message deleted successfully');
      
      // Оновлюємо список розмов
      await loadConversations();
      
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

  const handleEmojiClick = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false); // Закриваємо picker після вибору
    inputRef.current?.focus();
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('messagesSoundEnabled', String(newValue));
    console.log('🔊 Sound notifications:', newValue ? 'enabled' : 'disabled');
  };

  // Функція для відтворення звукового сигналу
  const playNotificationSound = () => {
    // Перевіряємо, чи звук увімкнено
    if (!soundEnabled) {
      console.log('🔇 Sound is disabled by user');
      return;
    }
    
    try {
      // Перевіряємо, чи сторінка активна (не на іншій вкладці)
      if (document.hidden) {
        console.log('🔇 Page is hidden, skipping sound');
        return;
      }
      
      // Перевіряємо, чи дозволено звук (користувач міг заблокувати автопрогравання)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Створюємо простий beep звук (800Hz, 200ms)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Частота звуку
      oscillator.type = 'sine'; // Тип хвилі
      
      // Envelope для плавного звуку
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      // Закриваємо контекст після відтворення
      setTimeout(() => {
        audioContext.close();
      }, 300);
    } catch (error) {
      console.warn('Не вдалося відтворити звуковий сигнал:', error);
      // Якщо Web Audio API не підтримується, пробуємо альтернативний метод
      try {
        // Простий beep через HTML5 Audio (якщо є файл)
        // Або просто ігноруємо помилку
      } catch (e) {
        // Тихо ігноруємо
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherUserProfile = () => {
    if (!selectedConversation) return null;
    return selectedConversation.friend_profile || conversations.find(c => c.user_id === selectedConversation.user_id)?.friend_profile;
  };

  // Функція для перевірки, чи користувач онлайн (за last_seen)
  const isUserOnline = (userId) => {
    if (!userId) return false;
    const lastSeen = onlineUsersMap.get(userId);
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  // Завантажуємо last_seen для користувачів у розмовах
  useEffect(() => {
    if (!currentUser?.id || conversations.length === 0) return;
    
    const loadOnlineStatus = async () => {
      try {
        const userIds = conversations.map(c => c.user_id).filter(Boolean);
        if (userIds.length === 0) return;
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, last_seen')
          .in('id', userIds);
        
        if (profiles) {
          const map = new Map();
          profiles.forEach(p => {
            if (p.last_seen) {
              map.set(p.id, p.last_seen);
            }
          });
          setOnlineUsersMap(map);
        }
      } catch (error) {
        console.error('Error loading online status:', error);
      }
    };
    
    loadOnlineStatus();
    // Оновлюємо кожні 30 секунд
    const interval = setInterval(loadOnlineStatus, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id, conversations.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[32px] shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <Lock size={32} className="text-blue-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Потрібна авторизація</h1>
              <p className="text-sm text-gray-600">
                Щоб користуватися приватними повідомленнями, увійдіть або зареєструйтесь
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={20} strokeWidth={2.5} />
                Увійти
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-800 font-semibold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={20} strokeWidth={2.5} />
                Створити акаунт
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
              >
                На головну
              </button>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-3">З акаунтом ви зможете:</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Надсилати й отримувати приватні повідомлення</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Додавати друзів і спілкуватись</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Писати авторам оголошень напряму</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
          />
        )}
        {showRegisterModal && (
          <RegisterModal
            onClose={() => setShowRegisterModal(false)}
            onSwitchToLogin={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
          />
        )}
      </div>
    );
  }

  const isChatView = !!userId;

  return (
    <div
      className={
        isChatView
          ? 'h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] flex flex-col overflow-hidden bg-gray-50'
          : 'min-h-screen bg-gray-50'
      }
    >
      <div
        className={
          isChatView
            ? 'flex-1 min-h-0 flex flex-col overflow-hidden p-0 max-w-7xl mx-auto w-full'
            : 'max-w-7xl mx-auto p-2 md:p-4 lg:p-8 pb-0'
        }
      >
        {/* Header - прихований на мобільному, коли обрана розмова */}
        <div className={`flex-shrink-0 ${userId ? 'hidden md:block' : ''}`}>
          <div className="mb-4 md:mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-3 md:mb-4 font-semibold transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2} />
              <span>Назад</span>
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 flex items-center gap-2 md:gap-3">
                <MessageSquare size={24} className="md:w-8 md:h-8 text-blue-600" strokeWidth={2} />
                <span className="hidden sm:inline">Приватні повідомлення</span>
                <span className="sm:hidden">Повідомлення</span>
              </h1>
              {/* Перемикач звуку */}
              <button
                onClick={toggleSound}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all"
                title={soundEnabled ? 'Вимкнути звукові сповіщення' : 'Увімкнути звукові сповіщення'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 size={18} className="md:w-5 md:h-5 text-blue-600" strokeWidth={2} />
                    <span className="text-xs md:text-sm font-semibold text-gray-700 hidden md:inline">Звук увімкнено</span>
                  </>
                ) : (
                  <>
                    <VolumeX size={18} className="md:w-5 md:h-5 text-gray-400" strokeWidth={2} />
                    <span className="text-xs md:text-sm font-semibold text-gray-500 hidden md:inline">Звук вимкнено</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className={
            isChatView
              ? 'flex-1 min-h-0 flex flex-col overflow-hidden bg-white rounded-none md:rounded-3xl md:shadow-sm md:border md:border-gray-200'
              : 'bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col'
          }
        >
          <div
            className={
              isChatView
                ? 'grid grid-cols-1 lg:grid-cols-3 flex-1 min-h-0 overflow-hidden'
                : 'grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-180px)] md:h-[calc(100vh-200px)] lg:h-[calc(100vh-220px)]'
            }
          >
            {/* Conversations List - прихований на мобільному, коли обрана розмова */}
            <div className={`lg:col-span-1 border-r border-gray-200 overflow-hidden flex flex-col ${userId ? 'hidden md:flex' : ''}`}>
            <div className="p-2 md:p-4 border-b border-gray-200 bg-white">
              <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users size={18} className="md:w-5 md:h-5 text-blue-600" strokeWidth={2} />
                Розмови
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              {conversations.length === 0 ? (
                <div className="p-6 md:p-8 text-center text-gray-500">
                  <Users size={40} className="md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" strokeWidth={1.5} />
                  <p className="text-sm md:text-base">У вас немає розмов</p>
                  <p className="text-xs md:text-sm mt-2">Почніть спілкування з іншими користувачами</p>
                </div>
              ) : (
                <div>
                  {/* Друзі */}
                  {friendsConversations.length > 0 && (
                    <div className="p-2 md:p-3 border-b border-gray-200 bg-blue-50">
                      <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-blue-700">
                        <UserCheck size={14} className="md:w-4 md:h-4 text-blue-600" strokeWidth={2} />
                        <span>Друзі ({friendsConversations.length})</span>
                      </div>
                    </div>
                  )}
                  {friendsConversations.map((conv) => {
                    const isSelected = selectedConversation?.user_id === conv.user_id;
                    const isOnline = isUserOnline(conv.user_id);
                    return (
                      <button
                        key={conv.user_id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          navigate(`/messages/${conv.user_id}`);
                        }}
                        className={`w-full p-2.5 md:p-4 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs md:text-base">
                                {(conv.friend_profile?.full_name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {/* Зелений індикатор онлайн */}
                            {isOnline && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                              <p className="font-bold text-gray-900 truncate text-xs md:text-sm">
                                {conv.friend_profile?.full_name || 'Користувач'}
                              </p>
                            </div>
                            {conv.last_message && (
                              <p className="text-[10px] md:text-xs text-gray-500 truncate">
                                {conv.last_message.message_type === 'friend_request' && conv.last_message.receiver_id === currentUser.id
                                  ? '🔔 Запит на дружбу'
                                  : conv.last_message.message}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {conv.last_message && (
                              <span className="text-[10px] md:text-xs text-gray-400">
                                {new Date(conv.last_message.created_at).toLocaleTimeString('uk-UA', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                            {conv.unread_count > 0 && (
                              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-blue-600 text-white text-[10px] md:text-xs font-bold rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                            {conv.last_message?.message_type === 'friend_request' && 
                             conv.last_message.receiver_id === currentUser.id && 
                             !conv.last_message.read && (
                              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-yellow-500 text-white text-[10px] md:text-xs font-bold rounded-full animate-pulse">
                                !
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Інші користувачі */}
                  {othersConversations.length > 0 && (
                    <div className="p-2 md:p-3 border-b border-gray-200 bg-gray-50 mt-1 md:mt-2">
                      <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-700">
                        <UserX size={14} className="md:w-4 md:h-4 text-blue-600" strokeWidth={2} />
                        <span>Інші користувачі ({othersConversations.length})</span>
                      </div>
                    </div>
                  )}
                  {othersConversations.map((conv) => {
                    const isSelected = selectedConversation?.user_id === conv.user_id;
                    const isOnline = isUserOnline(conv.user_id);
                    return (
                      <button
                        key={conv.user_id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          navigate(`/messages/${conv.user_id}`);
                        }}
                        className={`w-full p-2.5 md:p-4 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs md:text-base">
                                {(conv.friend_profile?.full_name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {/* Зелений індикатор онлайн */}
                            {isOnline && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                              <p className="font-bold text-gray-900 truncate text-xs md:text-sm">
                                {conv.friend_profile?.full_name || 'Користувач'}
                              </p>
                            </div>
                            {conv.last_message && (
                              <p className="text-[10px] md:text-xs text-gray-500 truncate">
                                {conv.last_message.message_type === 'friend_request' && conv.last_message.receiver_id === currentUser.id
                                  ? '🔔 Запит на дружбу'
                                  : conv.last_message.message}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {conv.last_message && (
                              <span className="text-[10px] md:text-xs text-gray-400">
                                {new Date(conv.last_message.created_at).toLocaleTimeString('uk-UA', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                            {conv.unread_count > 0 && (
                              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-blue-600 text-white text-[10px] md:text-xs font-bold rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                            {conv.last_message?.message_type === 'friend_request' && 
                             conv.last_message.receiver_id === currentUser.id && 
                             !conv.last_message.read && (
                              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-yellow-500 text-white text-[10px] md:text-xs font-bold rounded-full animate-pulse">
                                !
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            </div>

            {/* Messages Area */}
            <div className="lg:col-span-2 bg-white overflow-hidden flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                {/* Chat Header - Sticky зверху */}
                <div className="sticky top-0 z-20 px-2 py-1.5 md:p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 md:gap-3 flex-1 min-w-0">
                      {/* Кнопка "Назад" на мобільному */}
                      {userId && (
                        <button
                          onClick={() => navigate('/messages')}
                          className="md:hidden flex-shrink-0 p-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ArrowLeft size={18} strokeWidth={2} />
                        </button>
                      )}
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs md:text-lg">
                            {(getOtherUserProfile()?.full_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {/* Зелений індикатор онлайн */}
                        {selectedConversation?.user_id && isUserOnline(selectedConversation.user_id) && (
                          <div className="absolute bottom-0 right-0 w-2 h-2 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs md:text-base truncate leading-tight">
                          {getOtherUserProfile()?.full_name || 'Користувач'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-1 md:gap-x-2 gap-y-0">
                          {getOtherUserProfile()?.district && (
                            <p className="text-[9px] md:text-xs text-gray-500 truncate">{getOtherUserProfile().district}</p>
                          )}
                          {(getOtherUserProfile()?.gender === 'male' || getOtherUserProfile()?.gender === 'female') && (
                            <span className="text-[9px] md:text-xs text-gray-500">
                              {getOtherUserProfile().gender === 'male' ? 'Чоловік' : 'Жінка'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Кнопка "Додати в друзі" для не-друзів */}
                    {selectedConversation && 
                     !blockedUsers.includes(selectedConversation.user_id) &&
                     friendshipStatus && 
                     friendshipStatus.status !== 'accepted' && 
                     friendshipStatus.status !== 'pending_sent' && (
                      <button
                        onClick={handleSendFriendRequest}
                        disabled={sendingFriendRequest}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {sendingFriendRequest ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Відправка...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} strokeWidth={2} />
                            <span>
                              {friendshipStatus.status === 'pending_received' 
                                ? 'Запит очікує підтвердження' 
                                : 'Додати в друзі'}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Показуємо статус, якщо запит вже відправлений */}
                    {selectedConversation && 
                     friendshipStatus && 
                     friendshipStatus.status === 'pending_sent' && (
                      <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl text-sm font-semibold flex-shrink-0">
                        <UserCheck size={18} strokeWidth={2} />
                        <span>Запит на дружбу відправлено</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages - скролиться тільки ця область */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4 min-h-0 bg-white"
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-8 md:py-12 text-gray-500">
                      <MessageSquare size={40} className="md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
                      <p className="text-sm md:text-base">Повідомлень поки немає</p>
                      <p className="text-xs md:text-sm mt-1.5 md:mt-2">Почніть розмову!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.sender_id === currentUser.id;
                      const isSystemMessage = message.message_type && message.message_type !== 'user';
                      const isFriendRequest = message.message_type === 'friend_request';
                      const isFriendRequestAccepted = message.message_type === 'friend_request_accepted';
                      const friendRequestId = message.metadata?.friend_request_id;
                      const isProcessing = processingRequest === message.id;
                      const requestIdMatches = friendRequestId != null && friendshipStatus?.id != null && String(friendRequestId) === String(friendshipStatus.id);
                      const canAcceptOrReject = isFriendRequest && !isOwn && friendRequestId && friendshipStatus?.status === 'pending_received' && requestIdMatches;
                      const showAcceptedLabel = friendshipStatus?.status === 'accepted' && requestIdMatches;
                      
                      // Системне повідомлення про запит на дружбу — завжди показуємо отримані запити; кнопки тільки якщо запит ще очікує
                      if (isFriendRequest && !isOwn) {
                        return (
                          <div key={message.id} className="flex justify-center w-full my-1 md:my-2">
                            <div className="max-w-[90%] md:max-w-[80%] w-fit rounded-xl md:rounded-2xl px-3 md:px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
                              <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                                <UserCheck size={16} className="md:w-5 md:h-5 text-yellow-600" />
                                <p className="font-bold text-gray-900 text-xs md:text-sm">Системне повідомлення</p>
                              </div>
                              <p className="text-xs md:text-sm text-gray-700 mb-3 md:mb-4">{message.message}</p>
                              {canAcceptOrReject ? (
                                <div className="flex gap-1.5 md:gap-2">
                                  <button
                                    onClick={async () => {
                                      setProcessingRequest(message.id);
                                      try {
                                        await markMessageAsRead(message.id);
                                        const acceptedRequest = await acceptFriendRequest(friendRequestId);
                                        await new Promise(resolve => setTimeout(resolve, 300));
                                        await loadConversations();
                                        await loadMessages(selectedConversation.user_id);
                                        await loadFriendshipStatus(selectedConversation.user_id);
                                        window.dispatchEvent(new CustomEvent('friendRequestAccepted', {
                                          detail: { friendRequestId, acceptedRequest }
                                        }));
                                        alert('Запит на дружбу прийнято! Користувача додано до друзів.');
                                      } catch (error) {
                                        console.error('Error accepting friend request:', error);
                                        alert('Помилка при прийнятті запиту: ' + (error.message || 'Невідома помилка'));
                                      } finally {
                                        setProcessingRequest(null);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-green-500 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 md:gap-2"
                                  >
                                    {isProcessing ? (
                                      <Loader2 size={14} className="md:w-[18px] md:h-[18px] animate-spin" />
                                    ) : (
                                      <>
                                        <Check size={14} className="md:w-[18px] md:h-[18px]" />
                                        <span>Прийняти</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setProcessingRequest(message.id);
                                      try {
                                        await rejectFriendRequest(friendRequestId);
                                        await markMessageAsRead(message.id);
                                        await loadMessages(selectedConversation.user_id);
                                        await loadConversations();
                                        await loadFriendshipStatus(selectedConversation.user_id);
                                        alert('Запит на дружбу відхилено');
                                      } catch (error) {
                                        console.error('Error rejecting friend request:', error);
                                        alert('Помилка при відхиленні запиту: ' + (error.message || 'Невідома помилка'));
                                      } finally {
                                        setProcessingRequest(null);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-red-500 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 md:gap-2"
                                  >
                                    {isProcessing ? (
                                      <Loader2 size={14} className="md:w-[18px] md:h-[18px] animate-spin" />
                                    ) : (
                                      <>
                                        <X size={14} className="md:w-[18px] md:h-[18px]" />
                                        <span>Відхилити</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : showAcceptedLabel ? (
                                <p className="text-xs md:text-sm text-green-600 font-medium flex items-center gap-1 md:gap-1.5">
                                  <Check size={14} className="md:w-4 md:h-4" />
                                  Ви прийняли цей запит
                                </p>
                              ) : null}
                              <p className="text-[10px] md:text-xs text-gray-500 mt-1.5 md:mt-2">
                                {new Date(message.created_at).toLocaleTimeString('uk-UA', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      // Системне повідомлення про прийняття запиту
                      if (isFriendRequestAccepted) {
                        return (
                          <div key={message.id} className="flex justify-center w-full my-1 md:my-2">
                            <div className="max-w-[90%] md:max-w-[80%] w-fit rounded-xl md:rounded-2xl px-3 md:px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                              <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                                <Check size={16} className="md:w-5 md:h-5 text-green-600" />
                                <p className="font-bold text-gray-900 text-xs md:text-sm">Системне повідомлення</p>
                              </div>
                              <p className="text-xs md:text-sm text-gray-700">{message.message}</p>
                              <p className="text-[10px] md:text-xs text-gray-500 mt-1.5 md:mt-2">
                                {new Date(message.created_at).toLocaleTimeString('uk-UA', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      // Звичайне повідомлення
                      return (
                        <div
                          key={message.id}
                          className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-1.5 md:gap-2`}
                        >
                          {isOwn && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={deletingMessageId === message.id}
                              className="mb-1 p-1 md:p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 flex-shrink-0 opacity-0 group-hover:opacity-100"
                              title="Видалити повідомлення"
                            >
                              <Trash2 size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={2} />
                            </button>
                          )}
                          <div className="flex flex-col items-end gap-0.5 md:gap-1" style={{ maxWidth: '85%', width: 'fit-content' }}>
                            <div
                              className={`rounded-xl md:rounded-2xl px-3 py-1.5 md:px-4 md:py-2 ${
                                isOwn
                                  ? 'bg-blue-600 text-white'
                                  : isSystemMessage
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {isSystemMessage && (
                                <div className="flex items-center gap-1 mb-0.5 md:mb-1">
                                  <MessageSquare size={10} className="md:w-3 md:h-3 text-purple-600" strokeWidth={2} />
                                  <span className="text-[10px] md:text-xs font-semibold text-purple-700">Система</span>
                                </div>
                              )}
                              <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words">{message.message}</p>
                            </div>
                            <div className={`flex items-center gap-1 md:gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className={`text-[10px] md:text-xs ${isOwn ? 'text-gray-400' : 'text-gray-400'}`}>
                                {new Date(message.created_at).toLocaleTimeString('uk-UA', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {/* Індикатор прочитання (тільки для своїх повідомлень) */}
                              {isOwn && (
                                <span className="text-[10px] md:text-xs">
                                  {message.read ? (
                                    <CheckCheck size={12} className="md:w-[14px] md:h-[14px] text-blue-600" strokeWidth={2.5} />
                                  ) : (
                                    <Check size={12} className="md:w-[14px] md:h-[14px] text-gray-400" strokeWidth={2.5} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Typing Indicator */}
                  {isTyping && selectedConversation && (
                    <div className="flex justify-start items-center gap-2 px-2 md:px-4 py-1.5 md:py-2">
                      <div className="bg-gray-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-1.5 md:py-2">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <span className="text-xs md:text-sm text-gray-600">
                            {getOtherUserProfile()?.full_name || 'Користувач'} друкує
                          </span>
                          <div className="flex gap-0.5 md:gap-1">
                            <motion.span
                              className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full"
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span
                              className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full"
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.span
                              className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full"
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input - Sticky знизу, safe-area для вирізів */}
                {!messages.some(m => m.message_type === 'friend_request' && m.receiver_id === currentUser.id && !m.read) && (
                  <div className="sticky bottom-0 z-20 px-2 py-2 md:p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-4 border-t border-gray-200 bg-white shadow-sm flex-shrink-0">
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={messageText}
                          onChange={(e) => {
                            setMessageText(e.target.value);
                            handleTyping(e.target.value);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleStopTyping();
                              handleSendMessage();
                            }
                          }}
                          onFocus={() => {
                            if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
                              requestAnimationFrame(() => {
                                inputRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
                              });
                            }
                          }}
                          onBlur={() => {
                            handleStopTyping();
                          }}
                          placeholder="Написати повідомлення..."
                          className="w-full pl-4 md:pl-5 pr-12 md:pr-14 py-2.5 md:py-3.5 rounded-full border-2 border-gray-200 bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-sm md:text-base"
                        />
                        
                        {/* Emoji Button - ВСЕРЕДИНІ поля вводу */}
                        <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                          <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-1.5 md:p-2 hover:bg-gray-200/50 rounded-full transition-all"
                            title="Емодзі"
                            type="button"
                          >
                            <span className="text-lg md:text-xl leading-none">😀</span>
                          </button>
                        </div>

                        {/* Emoji Picker Popover - Відкривається ВГОРУ над полем */}
                        {showEmojiPicker && (
                          <motion.div
                            ref={emojiPickerRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl md:rounded-2xl shadow-2xl border border-gray-200 p-2 md:p-3 grid grid-cols-6 gap-1.5 md:gap-2 z-[100]"
                            style={{ width: '280px', maxWidth: '90vw' }}
                          >
                            <div className="col-span-6 text-[10px] md:text-xs text-gray-500 font-medium mb-1 text-center">
                              Виберіть емодзі:
                            </div>
                            {['😀', '😂', '🥰', '😍', '🤗', '🤔', '😎', '🥳', '😊', '😇', '🙂', '😉',
                              '❤️', '💙', '💛', '💚', '🧡', '💜', '🖤', '🤍', '💕', '💖', '✨', '⭐',
                              '👍', '👏', '🙏', '💪', '✌️', '🤝', '👋', '🙌', '🎉', '🎊', '🔥', '💯',
                              '🇺🇦', '🌍', '🌈', '☀️', '🌙', '⚡', '💫', '🌟'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-lg md:text-2xl hover:bg-blue-50 rounded-lg p-1.5 md:p-2 transition-all hover:scale-125 active:scale-95"
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
                        disabled={!messageText.trim() || sending}
                        className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                      >
                        {sending ? (
                          <Loader2 size={18} className="md:w-5 md:h-5 animate-spin" />
                        ) : (
                          <Send size={18} className="md:w-5 md:h-5" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-4 md:p-8 bg-white">
                <div>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-gray-200">
                    <MessageCircle size={32} className="md:w-10 md:h-10 text-blue-600" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1.5 md:mb-2">Виберіть розмову</h3>
                  <p className="text-gray-500 text-xs md:text-sm">Оберіть друга зі списку, щоб почати спілкування</p>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
