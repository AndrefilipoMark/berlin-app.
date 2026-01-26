import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Calendar,
  ArrowLeft,
  Mail,
  Loader2,
  Heart,
  MessageSquare,
  MessageCircle,
  Briefcase,
  Home,
  Sparkles,
  UserPlus,
  Check,
  X as XIcon,
  Users,
  Bell,
  Trash2,
  Ban,
  UserX,
  Search,
  Grid3x3,
  List,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getActivityByUser, getFriends, getFriendRequests, acceptFriendRequest, rejectFriendRequest, removeFriend, blockUser, unblockUser, getBlockedUsers, isUserBlocked } from '../lib/supabase';
import { onEvent, Events } from '../lib/events';
import ConfirmModal from '../components/ConfirmModal';

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [activity, setActivity] = useState({
    posts: [],
    replies: [],
    jobs: [],
    housing: [],
    services: [],
    likesReceived: 0,
  });
  const [activityLoading, setActivityLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [friendsSearchTerm, setFriendsSearchTerm] = useState('');
  const [friendsViewMode, setFriendsViewMode] = useState('grid'); // 'grid' or 'list'

  const loadActivity = useCallback(async (userId) => {
    if (!userId) return;
    setActivityLoading(true);
    try {
      const data = await getActivityByUser(userId);
      setActivity(data);
    } catch (e) {
      console.warn('loadActivity error:', e);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
    loadProfile();
  }, [id]);

  useEffect(() => {
    if (profile?.id) {
      loadActivity(profile.id);
      if (isOwnProfile()) {
        console.log('🔄 Loading friends, requests, and blocked users for own profile');
        loadFriends();
        loadFriendRequests();
        loadBlockedUsers();
      }
    }
  }, [profile?.id, loadActivity, currentUser?.id]);

  // Слухаємо події про прийняття запитів на дружбу
  useEffect(() => {
    const handleFriendRequestAccepted = async (event) => {
      console.log('📢 Friend request accepted event received:', event.detail);
      if (isOwnProfile()) {
        // Невелика затримка для оновлення в базі
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadFriends();
        await loadFriendRequests();
        console.log('✅ Friends list reloaded');
      }
    };

    window.addEventListener('friendRequestAccepted', handleFriendRequestAccepted);
    return () => {
      window.removeEventListener('friendRequestAccepted', handleFriendRequestAccepted);
    };
  }, [currentUser?.id, profile?.id]);

  useEffect(() => {
    const refetch = () => profile?.id && loadActivity(profile.id);
    const unsubs = [
      onEvent(Events.FORUM_POST_ADDED, refetch),
      onEvent(Events.FORUM_POST_DELETED, refetch),
      onEvent(Events.JOB_ADDED, refetch),
      onEvent(Events.JOB_DELETED, refetch),
      onEvent(Events.HOUSING_ADDED, refetch),
      onEvent(Events.HOUSING_DELETED, refetch),
      onEvent(Events.SERVICE_ADDED, refetch),
      onEvent(Events.SERVICE_DELETED, refetch),
    ];
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && profile?.id) loadActivity(profile.id);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      unsubs.forEach((u) => (typeof u === 'function' ? u() : null));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [profile?.id, loadActivity]);

  const loadCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      if (!data) {
        setError('Профіль не знайдено');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Помилка при завантаженні профілю');
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = () => {
    return currentUser && currentUser.id === id;
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'завантаження...';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'щойно';
    
    return date.toLocaleDateString('uk-UA', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const loadFriends = async () => {
    if (!currentUser?.id) return;
    try {
      setFriendsLoading(true);
      console.log('🔄 Loading friends for profile page, user:', currentUser.id);
      const data = await getFriends(currentUser.id);
      console.log('✅ Friends loaded for profile:', data.length, data.map(f => f.friend_profile?.full_name));
      setFriends(data);
    } catch (error) {
      console.error('❌ Error loading friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    if (!currentUser?.id) return;
    try {
      setRequestsLoading(true);
      const data = await getFriendRequests(currentUser.id);
      setFriendRequests(data);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      await loadFriendRequests();
      await loadFriends();
      alert('Запит на дружбу прийнято!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Помилка при прийнятті запиту');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Помилка при відхиленні запиту');
    }
  };

  const loadBlockedUsers = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await getBlockedUsers(currentUser.id);
      setBlockedUsers(data);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const handleDeleteFriend = async () => {
    if (!selectedFriend || !currentUser?.id || actionLoading) return;
    
    try {
      setActionLoading(true);
      await removeFriend(currentUser.id, selectedFriend.friend_profile.id);
      await loadFriends();
      setShowDeleteConfirm(false);
      setSelectedFriend(null);
      alert('Користувача видалено з друзів');
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Помилка при видаленні друга');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedFriend || !currentUser?.id || actionLoading) return;
    
    try {
      setActionLoading(true);
      const friendId = selectedFriend.friend_profile?.id || selectedFriend.id;
      
      // Спочатку видаляємо з друзів, якщо вони друзі
      if (selectedFriend.friend_profile) {
        await removeFriend(currentUser.id, friendId);
      }
      // Потім блокуємо
      await blockUser(currentUser.id, friendId);
      await loadFriends();
      await loadBlockedUsers();
      setShowBlockConfirm(false);
      setSelectedFriend(null);
      alert('Користувача додано до чорного списку');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Помилка при блокуванні користувача');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedFriend || !currentUser?.id || actionLoading) return;
    
    try {
      setActionLoading(true);
      await unblockUser(currentUser.id, selectedFriend.blocked_user_id || selectedFriend.blocked_user?.id);
      await loadBlockedUsers();
      setShowUnblockConfirm(false);
      setSelectedFriend(null);
      alert('Користувача видалено з чорного списку');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Помилка при розблокуванні користувача');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={48} className="text-red-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            {error || 'Профіль не знайдено'}
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
          >
            На головну
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Назад</span>
        </motion.button>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card - Large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-200"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-36 h-36 md:w-40 md:h-40 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-6xl md:text-7xl">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email?.charAt(0).toUpperCase() || 'У'}
                  </span>
                </div>
                {isOwnProfile() && (
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md">
                    Це ви
                  </div>
                )}
              </div>

              {/* Name and Basic Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                  {profile.full_name || 'Користувач'}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {profile.district && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl text-gray-700 font-semibold">
                      <MapPin size={18} className="text-blue-600" />
                      <span>{profile.district}</span>
                    </div>
                  )}
                  {(profile.gender === 'male' || profile.gender === 'female') && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl text-gray-700 font-semibold">
                      <Users size={18} className="text-blue-600" />
                      <span>{profile.gender === 'male' ? 'Чоловік' : 'Жінка'}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 px-4 py-2 bg-white border border-gray-200 rounded-2xl">
                      <Mail size={16} className="text-blue-600" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>
                {isOwnProfile() && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                  >
                    Редагувати профіль
                  </button>
                )}
              </div>
            </div>

            {/* Bio Section */}
            {profile.bio && (
              <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Про себе
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            {!profile.bio && isOwnProfile() && (
              <div className="p-6 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-center">
                <p className="text-gray-500 mb-3">Розкажіть про себе</p>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Додати інформацію
                </button>
              </div>
            )}
          </motion.div>

          {/* Side Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Member Since Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Член спільноти з</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatJoinDate(profile.created_at)}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Location Card */}
            {profile.district && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MapPin size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Локація</div>
                    <div className="text-2xl font-bold text-gray-900">{profile.district}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Берлін, Німеччина
                </div>
              </motion.div>
            )}

            {/* Profile Completeness */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-sm font-bold text-gray-900 mb-4">Статус профілю</h3>
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${profile.full_name ? 'text-gray-900' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${profile.full_name ? 'bg-blue-600' : 'bg-gray-400'}`} />
                  <span className="text-sm">Ім'я</span>
                </div>
                <div className={`flex items-center gap-2 ${profile.district ? 'text-gray-900' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${profile.district ? 'bg-blue-600' : 'bg-gray-400'}`} />
                  <span className="text-sm">Район</span>
                </div>
                <div className={`flex items-center gap-2 ${profile.gender ? 'text-gray-900' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${profile.gender ? 'bg-blue-600' : 'bg-gray-400'}`} />
                  <span className="text-sm">Пол</span>
                </div>
                <div className={`flex items-center gap-2 ${profile.bio ? 'text-gray-900' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${profile.bio ? 'bg-blue-600' : 'bg-gray-400'}`} />
                  <span className="text-sm">Про себе</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-2xl font-bold text-gray-900">
                  {[profile.full_name, profile.district, profile.bio].filter(Boolean).length}/3
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {profile.full_name && profile.district && profile.bio ? 'Повний профіль' : 'Базовий профіль'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-white rounded-3xl p-8 shadow-sm border border-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Активність</h2>
          {activityLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-gray-200">
                <Heart size={24} className="text-blue-600 mb-2" strokeWidth={2} />
                <span className="text-2xl font-bold text-gray-900">{activity.likesReceived}</span>
                <span className="text-xs text-gray-600 font-medium">лайків</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-gray-200">
                <MessageSquare size={24} className="text-blue-600 mb-2" strokeWidth={2} />
                <span className="text-2xl font-bold text-gray-900">{activity.posts.length}</span>
                <span className="text-xs text-gray-600 font-medium">постів</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-gray-200">
                <MessageCircle size={24} className="text-blue-600 mb-2" strokeWidth={2} />
                <span className="text-2xl font-bold text-gray-900">{activity.replies.length}</span>
                <span className="text-xs text-gray-600 font-medium">коментарів</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-gray-200">
                <Briefcase size={24} className="text-blue-600 mb-2" strokeWidth={2} />
                <span className="text-2xl font-bold text-gray-900">{activity.jobs.length}</span>
                <span className="text-xs text-gray-600 font-medium">вакансій</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-gray-200">
                <Home size={24} className="text-blue-600 mb-2" strokeWidth={2} />
                <span className="text-2xl font-bold text-gray-900">{activity.housing.length}</span>
                <span className="text-xs text-gray-600 font-medium">житло</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-gray-200">
                <Sparkles size={24} className="text-blue-600 mb-2" strokeWidth={2} />
                <span className="text-2xl font-bold text-gray-900">{activity.services.length}</span>
                <span className="text-xs text-gray-600 font-medium">послуг</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Friends Section - Only for own profile */}
        {isOwnProfile() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 bg-white rounded-3xl p-8 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users size={28} className="text-blue-600" strokeWidth={2} />
                Друзі
                {friends.length > 0 && (
                  <span className="text-lg font-normal text-gray-500">
                    ({friends.length})
                  </span>
                )}
              </h2>
            </div>

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={20} className="text-blue-600" strokeWidth={2} />
                  <h3 className="text-lg font-bold text-gray-900">Запити на дружбу</h3>
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {friendRequests.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {(request.user?.full_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {request.user?.full_name || 'Користувач'}
                          </p>
                          <p className="text-sm text-gray-600">
                            хоче додати вас у друзі
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0 mt-1">
                            {request.user?.district && (
                              <span className="text-xs text-gray-500">{request.user.district}</span>
                            )}
                            {(request.user?.gender === 'male' || request.user?.gender === 'female') && (
                              <span className="text-xs text-amber-600">
                                {request.user.gender === 'male' ? 'Чоловік' : 'Жінка'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center gap-2"
                        >
                          <Check size={18} />
                          Прийняти
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
                        >
                          <XIcon size={18} />
                          Відхилити
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            {friendsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-gray-500">У вас поки немає друзів</p>
                <p className="text-sm text-gray-400 mt-2">
                  Додавайте друзів, клікаючи на авторів в оголошеннях
                </p>
              </div>
            ) : (
              <>
                {/* Search and View Toggle */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-auto sm:flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="Пошук друзів..."
                      value={friendsSearchTerm}
                      onChange={(e) => setFriendsSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setFriendsViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${
                        friendsViewMode === 'grid'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Сітка"
                    >
                      <Grid3x3 size={18} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => setFriendsViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${
                        friendsViewMode === 'list'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Список"
                    >
                      <List size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Filtered Friends */}
                {(() => {
                  const filteredFriends = friends.filter((friend) => {
                    const name = friend.friend_profile?.full_name || '';
                    const district = friend.friend_profile?.district || '';
                    const searchLower = friendsSearchTerm.toLowerCase();
                    return name.toLowerCase().includes(searchLower) || district.toLowerCase().includes(searchLower);
                  });

                  if (filteredFriends.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Search size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Друзів не знайдено</p>
                      </div>
                    );
                  }

                  return friendsViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredFriends.map((friend) => (
                        <motion.div
                          key={friend.id}
                          whileHover={{ scale: 1.02 }}
                          className="p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-600/30 transition-all relative min-w-0 shadow-sm"
                        >
                          <div 
                            className="flex flex-col items-center text-center cursor-pointer min-w-0 w-full"
                            onClick={() => navigate(`/profile/${friend.friend_profile.id}`)}
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-2 flex-shrink-0">
                              <span className="text-white font-bold text-lg">
                                {(friend.friend_profile?.full_name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Ім'я з обрізанням */}
                            <div className="w-full min-w-0 mb-1">
                              <p className="font-bold text-gray-900 text-xs truncate" title={friend.friend_profile?.full_name || 'Користувач'}>
                                {friend.friend_profile?.full_name || 'Користувач'}
                              </p>
                            </div>
                            
                            {/* Район / Стать */}
                            <div className="w-full min-w-0 mb-2 space-y-0.5">
                              {friend.friend_profile?.district && (
                                <p className="text-[10px] text-gray-500 truncate" title={friend.friend_profile.district}>
                                  {friend.friend_profile.district}
                                </p>
                              )}
                              {(friend.friend_profile?.gender === 'male' || friend.friend_profile?.gender === 'female') && (
                                <p className="text-[10px] text-amber-600">
                                  {friend.friend_profile.gender === 'male' ? 'Чоловік' : 'Жінка'}
                                </p>
                              )}
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/messages/${friend.friend_profile.id}`);
                              }}
                              className="mt-auto px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-semibold hover:bg-blue-700 transition-all w-full"
                            >
                              Написати
                            </button>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedFriend(friend);
                                setShowDeleteConfirm(true);
                              }}
                              className="flex-1 px-2 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-[10px] font-semibold hover:bg-red-500/20 transition-all flex items-center justify-center gap-1 min-w-0"
                              title="Видалити з друзів"
                            >
                              <Trash2 size={12} className="flex-shrink-0" />
                              <span className="truncate hidden sm:inline">Видалити</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFriend(friend);
                                setShowBlockConfirm(true);
                              }}
                              className="flex-1 px-2 py-1.5 bg-orange-500/10 text-orange-600 rounded-lg text-[10px] font-semibold hover:bg-orange-500/20 transition-all flex items-center justify-center gap-1 min-w-0"
                              title="Додати до чорного списку"
                            >
                              <Ban size={12} className="flex-shrink-0" />
                              <span className="truncate hidden sm:inline">Заблокувати</span>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredFriends.map((friend) => (
                        <motion.div
                          key={friend.id}
                          whileHover={{ x: 4 }}
                          className="p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-600/30 transition-all flex items-center gap-3 cursor-pointer shadow-sm"
                          onClick={() => navigate(`/profile/${friend.friend_profile.id}`)}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                              {(friend.friend_profile?.full_name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate" title={friend.friend_profile?.full_name || 'Користувач'}>
                              {friend.friend_profile?.full_name || 'Користувач'}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
                              {friend.friend_profile?.district && (
                                <p className="text-xs text-gray-500 truncate" title={friend.friend_profile.district}>
                                  {friend.friend_profile.district}
                                </p>
                              )}
                              {(friend.friend_profile?.gender === 'male' || friend.friend_profile?.gender === 'female') && (
                                <span className="text-xs text-amber-600">
                                  {friend.friend_profile.gender === 'male' ? 'Чоловік' : 'Жінка'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/messages/${friend.friend_profile.id}`);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all"
                            >
                              Написати
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFriend(friend);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-all"
                              title="Видалити з друзів"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFriend(friend);
                                setShowBlockConfirm(true);
                              }}
                              className="p-2 bg-orange-500/10 text-orange-600 rounded-lg hover:bg-orange-500/20 transition-all"
                              title="Заблокувати"
                            >
                              <Ban size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Blocked Users Section */}
            {blockedUsers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserX size={20} className="text-blue-600" strokeWidth={2} />
                  Заблоковані користувачі ({blockedUsers.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {blockedUsers.map((blocked) => {
                    const blockedUser = blocked.blocked_user || { id: blocked.blocked_user_id, full_name: 'Користувач', district: null };
                    return (
                      <motion.div
                        key={blocked.id}
                        className="p-4 bg-white rounded-2xl border border-gray-200 relative min-w-0 shadow-sm"
                      >
                        <div className="flex flex-col items-center text-center min-w-0 w-full">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-3 flex-shrink-0">
                            <span className="text-white font-bold text-xl">
                              {(blockedUser?.full_name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Ім'я з обрізанням */}
                          <div className="w-full min-w-0 mb-1">
                            <p className="font-bold text-gray-900 text-sm truncate" title={blockedUser?.full_name || 'Користувач'}>
                              {blockedUser?.full_name || 'Користувач'}
                            </p>
                          </div>
                          
                          {/* Район / Стать */}
                          <div className="w-full min-w-0 mb-3 space-y-0.5">
                            {blockedUser?.district && (
                              <p className="text-xs text-gray-500 truncate" title={blockedUser.district}>
                                {blockedUser.district}
                              </p>
                            )}
                            {(blockedUser?.gender === 'male' || blockedUser?.gender === 'female') && (
                              <p className="text-xs text-amber-600">
                                {blockedUser.gender === 'male' ? 'Чоловік' : 'Жінка'}
                              </p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedFriend({ blocked_user_id: blocked.blocked_user_id, blocked_user: blockedUser });
                              setShowUnblockConfirm(true);
                            }}
                            className="mt-auto px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition-all w-full flex items-center justify-center gap-1"
                          >
                            <Check size={14} className="flex-shrink-0" />
                            <span>Розблокувати</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Confirmation Modals */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedFriend(null);
          }}
          onConfirm={handleDeleteFriend}
          title="Видалити друга"
          message={`Ви впевнені, що хочете видалити ${selectedFriend?.friend_profile?.full_name || 'цього користувача'} зі списку друзів?`}
          confirmText="Видалити"
          cancelText="Скасувати"
          confirmColor="red"
          loading={actionLoading}
        />

        <ConfirmModal
          isOpen={showBlockConfirm}
          onClose={() => {
            setShowBlockConfirm(false);
            setSelectedFriend(null);
          }}
          onConfirm={handleBlockUser}
          title="Додати до чорного списку"
          message={`Ви впевнені, що хочете додати ${selectedFriend?.friend_profile?.full_name || 'цього користувача'} до чорного списку? Ви більше не будете отримувати повідомлення від цього користувача.`}
          confirmText="Заблокувати"
          cancelText="Скасувати"
          confirmColor="red"
          loading={actionLoading}
        />

        <ConfirmModal
          isOpen={showUnblockConfirm}
          onClose={() => {
            setShowUnblockConfirm(false);
            setSelectedFriend(null);
          }}
          onConfirm={handleUnblockUser}
          title="Розблокувати користувача"
          message={`Ви впевнені, що хочете розблокувати ${selectedFriend?.blocked_user?.full_name || 'цього користувача'}? Після розблокування ви знову зможете отримувати повідомлення.`}
          confirmText="Розблокувати"
          cancelText="Скасувати"
          confirmColor="green"
          loading={actionLoading}
        />
      </div>
    </div>
  );
}
