import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  MessageSquare,
  Clock,
  Send,
  Loader2,
  User,
  HelpCircle,
  Megaphone,
  Compass,
  Heart,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
  supabase,
  getForumPosts,
  getForumReplies,
  getProfilesByIds,
  createForumReply,
  getForumPostLikesForUser,
  getForumReplyLikesForUser,
  toggleForumPostLike,
  toggleForumReplyLike,
  deleteForumPost,
  deleteForumReply,
  updateForumPost,
} from '../lib/supabase';
import UserProfileModal from '../components/UserProfileModal';
import ForumCard from '../components/ForumCard';
import GuestGuard from '../components/GuestGuard';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import { onEvent, Events, emitEvent } from '../lib/events';

const FORUM_CATEGORIES = [
  { id: '', label: 'Всі теми', icon: Compass },
  { id: 'question', label: 'Питання', icon: HelpCircle },
  { id: 'discussion', label: 'Обговорення', icon: MessageSquare },
  { id: 'announcement', label: 'Оголошення', icon: Megaphone },
];

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [likedReplyIds, setLikedReplyIds] = useState(new Set());
  const [likingPostId, setLikingPostId] = useState(null);
  const [likingReplyId, setLikingReplyId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('question');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGuestGuard, setShowGuestGuard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [authorProfilesMap, setAuthorProfilesMap] = useState(new Map());
  const detailBlockRef = useRef(null);

  useEffect(() => {
    loadPosts();
    checkAuth();
    const unsub = onEvent(Events.FORUM_POST_ADDED, () => loadPosts());
    return unsub;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setLikedPostIds(new Set());
      setLikedReplyIds(new Set());
      return;
    }
    getForumPostLikesForUser(user.id).then(setLikedPostIds);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !selectedPost) {
      setLikedReplyIds(new Set());
      return;
    }
    getForumReplyLikesForUser(user.id).then(setLikedReplyIds);
  }, [user?.id, selectedPost?.id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) loadProfile(session.user.id);
  };

  const loadProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getForumPosts();
      const list = Array.isArray(data) ? data : [];
      setPosts(list);
      const ids = [...new Set(list.map((p) => p.user_id).filter(Boolean))];
      const map = await getProfilesByIds(ids);
      setAuthorProfilesMap(map);
    } catch (e) {
      console.warn('Error loading posts:', e);
      setPosts([]);
      setAuthorProfilesMap(new Map());
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (postId) => {
    try {
      const data = await getForumReplies(postId);
      setReplies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Error loading replies:', e);
      setReplies([]);
    }
  };

  const handlePostClick = async (post) => {
    setSelectedPost(post);
    await loadReplies(post.id);
    if (user?.id) {
      const replyLikes = await getForumReplyLikesForUser(user.id);
      setLikedReplyIds(replyLikes);
    }
    detailBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLikePost = async (postId, e) => {
    e?.stopPropagation();
    if (!user?.id) return;
    setLikingPostId(postId);
    try {
      const { liked } = await toggleForumPostLike(postId, user.id);
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      await loadPosts();
      if (selectedPost?.id === postId) setSelectedPost((p) => (p?.id === postId ? { ...p, likes_count: (p.likes_count ?? 0) + (liked ? 1 : -1) } : p));
    } catch (err) {
      console.error('Like post error:', err);
      alert('Не вдалося поставити лайк');
    } finally {
      setLikingPostId(null);
    }
  };

  const handleLikeReply = async (replyId, e) => {
    e?.stopPropagation();
    if (!user?.id) return;
    setLikingReplyId(replyId);
    try {
      const { liked } = await toggleForumReplyLike(replyId, user.id);
      setLikedReplyIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(replyId);
        else next.delete(replyId);
        return next;
      });
      await loadReplies(selectedPost?.id);
    } catch (err) {
      console.error('Like reply error:', err);
      alert('Не вдалося поставити лайк');
    } finally {
      setLikingReplyId(null);
    }
  };

  const isAdmin = profile?.is_admin === true;
  const authorNameMatch = (name) => {
    const n = (name || '').trim();
    return n && n === (profile?.full_name || '').trim();
  };
  const canEditPost = (post) =>
    isAdmin || (user?.id && (post?.user_id === user.id || (!post?.user_id && authorNameMatch(post?.author_name || post?.profiles?.full_name))));
  const canDeletePost = (post) =>
    isAdmin || (user?.id && (post?.user_id === user.id || (!post?.user_id && authorNameMatch(post?.author_name || post?.profiles?.full_name))));
  const canDeleteReply = (reply) =>
    isAdmin || (user?.id && (reply?.user_id === user.id || (!reply?.user_id && authorNameMatch(reply?.author_name || reply?.profiles?.full_name))));

  const handleDeletePost = async (post) => {
    if (!canDeletePost(post) || !window.confirm('Видалити цей пост?')) return;
    try {
      await deleteForumPost(post.id);
      setSelectedPost(null);
      setPosts((p) => p.filter((x) => x.id !== post.id));
      emitEvent(Events.FORUM_POST_ADDED);
      emitEvent(Events.FORUM_POST_DELETED);
    } catch (e) {
      console.error('Delete post error:', e);
      alert('Не вдалося видалити пост');
    }
  };

  const handleDeleteReply = async (reply) => {
    if (!canDeleteReply(reply) || !window.confirm('Видалити цей коментар?')) return;
    try {
      await deleteForumReply(reply.id);
      await loadReplies(selectedPost?.id);
      await loadPosts();
      setSelectedPost((p) => (p?.id === selectedPost?.id ? { ...p, replies_count: Math.max(0, (p.replies_count ?? 0) - 1) } : p));
      emitEvent(Events.FORUM_POST_DELETED);
    } catch (e) {
      console.error('Delete reply error:', e);
      alert('Не вдалося видалити коментар');
    }
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category || 'question');
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editTitle.trim() || !editContent.trim()) return;
    try {
      setSubmittingEdit(true);
      const updated = await updateForumPost(editingPost.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
      });
      setSelectedPost((p) => (p?.id === editingPost.id ? { ...p, ...updated } : p));
      setPosts((p) => p.map((x) => (x.id === editingPost.id ? { ...x, ...updated } : x)));
      setEditingPost(null);
      emitEvent(Events.FORUM_POST_ADDED);
    } catch (e) {
      console.error('Update post error:', e);
      alert('Не вдалося оновити пост');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !user || !selectedPost) return;
    try {
      setSubmittingReply(true);
      await createForumReply({
        post_id: selectedPost.id,
        author_name: profile?.full_name || 'Користувач',
        content: replyText.trim(),
        user_id: user.id,
      });
      setReplyText('');
      await loadReplies(selectedPost.id);
      await loadPosts();
      setSelectedPost((p) => (p?.id === selectedPost.id ? { ...p, replies_count: (p.replies_count ?? 0) + 1 } : p));
    } catch (e) {
      console.error('Error sending reply:', e);
      alert('Помилка при відправці відповіді');
    } finally {
      setSubmittingReply(false);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const n = new Date();
    const s = Math.floor((n - d) / 1000);
    if (s < 60) return 'щойно';
    if (s < 3600) return `${Math.floor(s / 60)}хв`;
    if (s < 86400) return `${Math.floor(s / 3600)}год`;
    if (s < 604800) return `${Math.floor(s / 86400)}дн`;
    return d.toLocaleDateString('uk-UA');
  };

  const filteredPosts = posts.filter((post) => {
    const matchCat = !selectedCategory || post.category === selectedCategory;
    return matchCat;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-gray-50/50 to-emerald-50/30 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="mb-8 md:mb-10 text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 md:mb-4"
          >
            Форум спільноти
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-600 max-w-2xl"
          >
            Запитуйте, діліться досвідом та допомагайте іншим українцям у Берліні.
          </motion.p>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2.5 md:gap-3">
            {FORUM_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-full font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-gray-500'} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main layout */}
        <div className="space-y-6">
          {selectedPost && (
            <motion.div
              ref={detailBlockRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[24px] shadow-md border border-slate-100 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50">
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedPost(null)}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-green-600 font-semibold text-sm"
                    >
                      <X size={18} />
                      Закрити
                    </button>
                  </div>
                  <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
                    {selectedPost.user_id ? (
                      <button
                        onClick={() => {
                          if (!user) {
                            setShowGuestGuard(true);
                            return;
                          }
                          setSelectedUserId(selectedPost.user_id);
                          setShowUserModal(true);
                        }}
                        className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-green-300 transition-shadow cursor-pointer"
                      >
                        <span className="text-white font-bold text-sm">
                          {(selectedPost.profiles?.full_name || selectedPost.author_name || '?').charAt(0)}
                        </span>
                      </button>
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {(selectedPost.profiles?.full_name || selectedPost.author_name || '?').charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 text-right">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        Автор:{' '}
                        {selectedPost.user_id ? (
                          <button
                            onClick={() => {
                              if (!user) {
                                setShowGuestGuard(true);
                                return;
                              }
                              setSelectedUserId(selectedPost.user_id);
                              setShowUserModal(true);
                            }}
                            className="text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                          >
                            {selectedPost.profiles?.full_name || selectedPost.author_name || 'Анонім'}
                          </button>
                        ) : (
                          selectedPost.profiles?.full_name || selectedPost.author_name || 'Анонім'
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 flex-wrap justify-end">
                        {getTimeAgo(selectedPost.created_at)}
                        {selectedPost.category && (() => {
                          const cat = FORUM_CATEGORIES.find((c) => c.id === selectedPost.category);
                          const CatIcon = cat?.icon || MessageSquare;
                          return (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <CatIcon size={10} />
                                {cat?.label || selectedPost.category}
                              </span>
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {canEditPost(selectedPost) && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditPost(selectedPost)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500/20 font-semibold text-xs"
                      >
                        <Edit2 size={14} />
                        Редагувати
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePost(selectedPost)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold text-xs"
                      >
                        <Trash2 size={14} />
                        Видалити
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleLikePost(selectedPost.id, e)}
                    disabled={!user || likingPostId === selectedPost.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${
                      user
                        ? likedPostIds.has(selectedPost.id)
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'bg-slate-50 text-slate-400 cursor-default'
                    }`}
                  >
                    {likingPostId === selectedPost.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Heart size={14} fill={likedPostIds.has(selectedPost.id) ? 'currentColor' : 'none'} />
                    )}
                    <span>{selectedPost.likes_count ?? 0}</span>
                  </button>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-3">
                  {selectedPost.title}
                </h2>
                <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 leading-relaxed border-l-4 border-green-500">
                  {selectedPost.content}
                </div>
              </div>

              <div className="p-6 max-h-[320px] overflow-y-auto border-b border-slate-100">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <MessageSquare size={18} className="text-green-500" />
                  Коментарі ({replies.length})
                </h4>
                {replies.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium italic text-center py-8">
                    Поки що немає коментарів. Залиште перший!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {replies.map((reply) => {
                      const replyAuthor = reply.profiles?.full_name || reply.author_name || 'Анонім';
                      const replyLikes = reply.likes_count ?? 0;
                      const replyLiked = likedReplyIds.has(reply.id);
                      const showDeleteReply = canDeleteReply(reply);
                      return (
                        <div key={reply.id} className="flex gap-3">
                          {reply.user_id ? (
                            <button
                              onClick={() => {
                                if (!user) {
                                  setShowGuestGuard(true);
                                  return;
                                }
                                setSelectedUserId(reply.user_id);
                                setShowUserModal(true);
                              }}
                              className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-blue-200 transition-shadow cursor-pointer"
                            >
                              <span className="text-blue-500 font-bold text-xs uppercase">{replyAuthor.charAt(0)}</span>
                            </button>
                          ) : (
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-500 font-bold text-xs uppercase">{replyAuthor.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-slate-900 text-[11px]">
                                  {reply.user_id ? (
                                    <button
                                      onClick={() => {
                                        if (!user) {
                                          setShowGuestGuard(true);
                                          return;
                                        }
                                        setSelectedUserId(reply.user_id);
                                        setShowUserModal(true);
                                      }}
                                      className="text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                                    >
                                      {replyAuthor}
                                    </button>
                                  ) : (
                                    replyAuthor
                                  )}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-slate-400">{getTimeAgo(reply.created_at)}</span>
                                  {showDeleteReply && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReply(reply)}
                                      className="text-red-500 hover:text-red-600 p-0.5 rounded"
                                      title="Видалити коментар"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 leading-snug mb-2">{reply.content}</p>
                              <button
                                type="button"
                                onClick={(e) => handleLikeReply(reply.id, e)}
                                disabled={!user || likingReplyId === reply.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                  user
                                    ? replyLiked
                                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                      : 'bg-slate-200/80 text-slate-500 hover:bg-slate-300'
                                    : 'bg-slate-100 text-slate-400 cursor-default'
                                }`}
                              >
                                {likingReplyId === reply.id ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Heart size={10} fill={replyLiked ? 'currentColor' : 'none'} />
                                )}
                                <span>{replyLikes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50">
                {user ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ваша відповідь..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                      className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={submittingReply || !replyText.trim()}
                      className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      {submittingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-center text-slate-500 font-medium">
                    Увійдіть, щоб мати змогу відповідати
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[24px] shadow-md border border-slate-100">
              <Loader2 size={48} className="text-green-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium italic">Завантажуємо обговорення...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[24px] p-16 shadow-md border border-slate-100 text-center flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <MessageCircle size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Поки що тут порожньо</h3>
              <p className="text-slate-500 max-w-sm">
                Тем у цій категорії ще немає. Станьте першим, хто запитає громаду!
              </p>
            </motion.div>
          ) : (
            <>
              {selectedPost && filteredPosts.filter((p) => p.id !== selectedPost.id).length > 0 && (
                <h3 className="text-lg font-bold text-slate-900">Інші теми</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(selectedPost ? filteredPosts.filter((p) => p.id !== selectedPost.id) : filteredPosts).map((post, index) => {
                  const cat = FORUM_CATEGORIES.find((c) => c.id === post.category);
                  const CatIcon = cat?.icon || MessageSquare;
                  const categoryLabel = cat?.label || post.category || '—';
                  const profile = authorProfilesMap.get(post.user_id);
                  return (
                    <ForumCard
                      key={post.id}
                      post={post}
                      index={index}
                      profile={profile}
                      categoryLabel={categoryLabel}
                      CatIcon={CatIcon}
                      getTimeAgo={getTimeAgo}
                      onPostClick={handlePostClick}
                      onLikeClick={handleLikePost}
                      onAuthorClick={(id) => {
                        if (!user) {
                          setShowGuestGuard(true);
                          return;
                        }
                        setSelectedUserId(id);
                        setShowUserModal(true);
                      }}
                      isLiked={likedPostIds.has(post.id)}
                      isLiking={likingPostId === post.id}
                      user={user}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {editingPost && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60" onClick={() => setEditingPost(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Редагувати пост</h3>
              <button type="button" onClick={() => setEditingPost(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Заголовок *</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Заголовок"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Текст *</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  placeholder="Зміст"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Категорія</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {FORUM_CATEGORIES.filter((c) => c.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleUpdatePost}
                disabled={submittingEdit || !editTitle.trim() || !editContent.trim()}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 disabled:opacity-50"
              >
                {submittingEdit ? 'Збереження…' : 'Зберегти'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showUserModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUserId(null);
          }}
          onShowLogin={() => setShowLoginModal(true)}
          onShowRegister={() => setShowRegisterModal(true)}
        />
      )}
      {showGuestGuard && (
        <GuestGuard
          onClose={() => setShowGuestGuard(false)}
          onLogin={() => { setShowGuestGuard(false); setShowLoginModal(true); }}
          onRegister={() => { setShowGuestGuard(false); setShowRegisterModal(true); }}
        />
      )}
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
