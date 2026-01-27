import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, User, UserPlus, Check, X as XIcon, MessageSquare, Loader2, Trash2, Ban, ExternalLink, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, getFriendshipStatus, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, blockUser, isUserBlocked } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import QuickMessageModal from './QuickMessageModal';
import ConfirmModal from './ConfirmModal';
import GuestGuard from './GuestGuard';

export default function UserProfileModal({ userId, onClose, onShowLogin, onShowRegister }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [friendship, setFriendship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  useEffect(() => {
    if (userId) {
      loadCurrentUser();
      loadProfile();
      loadFriendshipStatus();
    }
  }, [userId]);

  const loadCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendshipStatus = async () => {
    if (!currentUser?.id || !userId || currentUser.id === userId) return;

    try {
      const status = await getFriendshipStatus(currentUser.id, userId);
      setFriendship(status);
      const blocked = await isUserBlocked(currentUser.id, userId);
      setIsBlocked(blocked);
    } catch (error) {
      console.error('Error loading friendship status:', error);
    }
  };

  useEffect(() => {
    if (currentUser?.id && userId && currentUser.id !== userId) {
      loadFriendshipStatus();
    }
  }, [currentUser?.id, userId]);

  const handleAddFriend = async () => {
    if (!currentUser?.id || actionLoading) return;
    try {
      setActionLoading(true);
      await sendFriendRequest(currentUser.id, userId);
      await loadFriendshipStatus();
      alert('Запит на дружбу відправлено!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(error.message || 'Помилка при відправці запиту на дружбу');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!friendship?.id || actionLoading) return;
    try {
      setActionLoading(true);
      await acceptFriendRequest(friendship.id);
      await loadFriendshipStatus();
      alert('Запит на дружбу прийнято!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Помилка при прийнятті запиту на дружбу');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFriend = async () => {
    if (!friendship?.id || actionLoading) return;
    try {
      setActionLoading(true);
      await rejectFriendRequest(friendship.id);
      await loadFriendshipStatus();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!currentUser?.id || !friendship || actionLoading) return;
    try {
      setActionLoading(true);
      await removeFriend(currentUser.id, userId);
      await loadFriendshipStatus();
      setShowDeleteConfirm(false);
      alert('Користувача видалено з друзів');
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Помилка при видаленні друга');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!currentUser?.id || !userId || actionLoading) return;
    try {
      setActionLoading(true);
      if (friendship?.status === 'accepted') {
        await removeFriend(currentUser.id, userId);
      }
      await blockUser(currentUser.id, userId);
      await loadFriendshipStatus();
      setShowBlockConfirm(false);
      setShowMoreActions(false);
      alert('Користувача додано до чорного списку');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Помилка при блокуванні користувача');
    } finally {
      setActionLoading(false);
    }
  };

  /** Одна головна дія: написати. Без авторизації → /messages (екран «Потрібна авторизація»). Друзі → /messages/:id, не друзі → QuickMessage. */
  const handleMessage = () => {
    if (!currentUser) {
      onClose();
      navigate('/messages');
      return;
    }
    if (friendship?.status === 'accepted') {
      onClose();
      navigate(`/messages/${userId}`);
    } else {
      setShowQuickMessage(true);
    }
  };

  const handleViewProfile = () => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <AnimatePresence>
        <motion.div
          key="loading-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="loading-content"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-10"
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
              <p className="text-gray-500">Завантаження...</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!profile) {
    return null;
  }

  // Якщо користувач не авторизований і є callbacks для GuestGuard, показуємо GuestGuard
  if (!currentUser && (onShowLogin || onShowRegister)) {
    return (
      <GuestGuard
        onClose={onClose}
        onLogin={() => {
          onClose();
          if (onShowLogin) onShowLogin();
        }}
        onRegister={() => {
          onClose();
          if (onShowRegister) onShowRegister();
        }}
      />
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const isFriend = friendship?.status === 'accepted';
  const hasPendingRequest = friendship?.status === 'pending';
  const isRequestReceiver = hasPendingRequest && friendship.friend_id === currentUser?.id;
  const isRequestSender = hasPendingRequest && friendship.user_id === currentUser?.id;
  const displayName = profile.full_name || 'Користувач';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
    <AnimatePresence mode="wait">
      <motion.div
        key={`profile-modal-${userId}`}
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
          className="bg-white rounded-[32px] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-5 border-b border-gray-100 bg-white rounded-t-[32px]">
            <h2 className="text-lg font-bold text-gray-900 truncate pr-2">
              {displayName}
            </h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Закрити"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="p-4 md:p-6 space-y-5">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-azure-blue to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  {profile.district && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                      <span className="truncate">{profile.district}</span>
                    </p>
                  )}
                  {(profile.gender === 'male' || profile.gender === 'female') && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User size={14} className="flex-shrink-0 text-gray-400" />
                      <span>{profile.gender === 'male' ? 'Чоловік' : 'Жінка'}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {isOwnProfile && (
              <div className="py-3 px-4 bg-blue-50 rounded-xl text-center">
                <p className="text-sm text-blue-700 font-medium">Це ваш профіль</p>
              </div>
            )}

            {!isOwnProfile && (
              <div className="space-y-4">
                <button
                  onClick={handleMessage}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-azure-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare size={20} />
                  <span>Написати повідомлення</span>
                </button>

                {!friendship && (
                  <button
                    onClick={handleAddFriend}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-gray-100 text-gray-800 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Додати в друзі</span>
                      </>
                    )}
                  </button>
                )}

                {isRequestReceiver && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 text-center">
                      Хоче додати вас у друзі
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAcceptFriend}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 px-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        <span>Прийняти</span>
                      </button>
                      <button
                        onClick={handleRejectFriend}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XIcon size={16} />
                        <span>Відхилити</span>
                      </button>
                    </div>
                  </div>
                )}

                {isRequestSender && (
                  <div className="py-2.5 px-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-sm text-blue-700">Запит на дружбу надіслано</p>
                  </div>
                )}

                {isFriend && (
                  <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 rounded-xl">
                    <Check size={18} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">Ви друзі</span>
                  </div>
                )}

                <button
                  onClick={handleViewProfile}
                  className="w-full py-2.5 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} />
                  <span>Переглянути профіль</span>
                </button>

                {/* Додаткові дії — тільки для друзів */}
                {isFriend && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowMoreActions((v) => !v)}
                      className="w-full py-2 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      <MoreHorizontal size={18} />
                      <span>Інші дії</span>
                    </button>
                    {showMoreActions && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => { setShowDeleteConfirm(true); setShowMoreActions(false); }}
                          disabled={actionLoading}
                          className="flex-1 py-2 px-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                        >
                          <Trash2 size={16} />
                          <span>Видалити з друзів</span>
                        </button>
                        <button
                          onClick={() => { setShowBlockConfirm(true); setShowMoreActions(false); }}
                          disabled={actionLoading}
                          className="flex-1 py-2 px-3 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                        >
                          <Ban size={16} />
                          <span>Заблокувати</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>

    {showQuickMessage && (
      <QuickMessageModal
        receiverId={userId}
        receiverName={profile.full_name || 'Користувач'}
        onClose={() => setShowQuickMessage(false)}
        onSent={() => setShowQuickMessage(false)}
      />
    )}

    {showDeleteConfirm && (
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleRemoveFriend}
        title="Видалити з друзів"
        message={`Видалити ${profile?.full_name || 'цього користувача'} зі списку друзів?`}
        confirmText="Видалити"
        cancelText="Скасувати"
        confirmColor="red"
        loading={actionLoading}
      />
    )}

    {showBlockConfirm && (
      <ConfirmModal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleBlockUser}
        title="Заблокувати"
        message={`Додати ${profile?.full_name || 'цього користувача'} до чорного списку? Ви не будете отримувати повідомлення.`}
        confirmText="Заблокувати"
        cancelText="Скасувати"
        confirmColor="red"
        loading={actionLoading}
      />
    )}
  </>
  );
}
