import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Briefcase, Home as HomeIcon, Stethoscope, MessageCircle, Trash2, Edit, Eye, Lock, Loader2, TrendingUp, Mail, X, User, Calendar, MessageSquare, CheckCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

// ADMIN EMAIL - замініть на ваш реальний email
const ADMIN_EMAILS = [
  'andrefilipoua@gmail.com', // Ваш email
  'test@example.com', // Тестовий email
  'admin@berlin-app.com',
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    jobs: 0,
    housing: 0,
    services: 0,
    forumPosts: 0,
    messages: 0,
    adminMessages: 0,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab !== 'overview') {
      loadItems(activeTab);
    }
  }, [activeTab, isAdmin]);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/');
        return;
      }

      setUser(session.user);
      
      // Перевіряємо чи є користувач адміном через profiles.is_admin або email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle();
      
      const userIsAdmin = profileData?.is_admin || ADMIN_EMAILS.includes(session.user.email);
      setIsAdmin(userIsAdmin);
      
      if (!userIsAdmin) {
        alert('У вас немає доступу до адмін-панелі');
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const fetchCount = async (table) => {
      try {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        return count ?? 0;
      } catch {
        return 0;
      }
    };

    const [users, jobs, housing, services, forumPosts, messages, adminMessages] = await Promise.all([
      fetchCount('profiles'),
      fetchCount('jobs'),
      fetchCount('housing'),
      fetchCount('services'),
      fetchCount('forum_posts'),
      fetchCount('messages'),
      fetchCount('admin_messages'),
    ]);

    setStats({
      users,
      jobs,
      housing,
      services,
      forumPosts,
      messages,
      adminMessages,
    });
  };

  const loadItems = async (type) => {
    try {
      setItemsLoading(true);
      let query;
      
      switch (type) {
        case 'users':
          query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
          break;
        case 'jobs':
          query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
          break;
        case 'housing':
          query = supabase.from('housing').select('*').order('created_at', { ascending: false });
          break;
        case 'services':
          query = supabase.from('services').select('*').order('created_at', { ascending: false });
          break;
        case 'forum':
          query = supabase.from('forum_posts').select('*').order('created_at', { ascending: false });
          break;
        case 'messages':
          query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(100);
          break;
        case 'adminMessages':
          query = supabase.from('admin_messages').select('*').order('created_at', { ascending: false }).limit(100);
          break;
        default:
          return;
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Error loading items:', e);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Ви впевнені, що хочете видалити цей запис?')) return;

    setDeletingId(id);
    try {
      const tableMap = {
        users: 'profiles',
        jobs: 'jobs',
        housing: 'housing',
        services: 'services',
        forum: 'forum_posts',
        messages: 'messages',
        adminMessages: 'admin_messages',
      };

      const { error } = await supabase
        .from(tableMap[type])
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems((prev) => prev.filter((x) => x.id !== id));
      loadStats();
      alert('Успішно видалено!');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Помилка при видаленні: ' + (error?.message ?? String(error)));
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewMessage = async (message) => {
    console.log('Opening message:', message);
    setSelectedMessage(message);
    setShowMessageModal(true);
    
    // Оновлюємо статус на "read" якщо воно "new"
    if (message.status === 'new') {
      try {
        const { error } = await supabase
          .from('admin_messages')
          .update({ status: 'read' })
          .eq('id', message.id);

        if (error) throw error;
        
        // Оновлюємо локальний стан
        setItems(items.map(item => 
          item.id === message.id ? { ...item, status: 'read' } : item
        ));
        loadStats(); // Оновлюємо статистику
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    }
  };

  const handleApproveDeletion = async (message) => {
    alert(`Для видалення акаунту зайдіть у Supabase Dashboard, знайдіть користувача за Email (${message.user_email}) або ID і видаліть його вручну в розділі Authentication.`);
  };

  const handleUpdateMessageStatus = async (messageId, newStatus) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

      if (error) throw error;
      
      // Оновлюємо локальний стан
      setItems(items.map(item => 
        item.id === messageId ? { ...item, status: newStatus } : item
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
      
      loadStats();
    } catch (error) {
      console.error('Error updating message status:', error);
      alert('Помилка при оновленні статусу: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loader2 size={48} className="text-white animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Lock size={64} className="mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Доступ заборонено</h1>
          <p>У вас немає прав адміністратора</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Огляд', icon: TrendingUp },
    { id: 'users', label: 'Користувачі', icon: Users, count: stats.users },
    { id: 'jobs', label: 'Вакансії', icon: Briefcase, count: stats.jobs },
    { id: 'housing', label: 'Житло', icon: HomeIcon, count: stats.housing },
    { id: 'services', label: 'Сервіси', icon: Stethoscope, count: stats.services },
    { id: 'forum', label: 'Форум', icon: MessageCircle, count: stats.forumPosts },
    { id: 'adminMessages', label: 'Повідомлення', icon: Mail, count: stats.adminMessages },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <Shield size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-1">Адмін-панель</h1>
              <p className="text-blue-200">
                Привіт, {user?.email}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-2xl'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-white/20'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? (
          // Overview Stats
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Користувачі', value: stats.users, icon: Users, color: 'from-blue-500 to-cyan-500' },
              { label: 'Вакансії', value: stats.jobs, icon: Briefcase, color: 'from-azure-blue to-blue-600' },
              { label: 'Житло', value: stats.housing, icon: HomeIcon, color: 'from-vibrant-yellow to-orange-400' },
              { label: 'Сервіси', value: stats.services, icon: Stethoscope, color: 'from-teal-500 to-teal-600' },
              { label: 'Пости форуму', value: stats.forumPosts, icon: MessageCircle, color: 'from-green-500 to-emerald-600' },
              { label: 'Повідомлення', value: stats.messages, icon: MessageCircle, color: 'from-red-500 to-pink-600' },
              { label: 'Повідомлення адміну', value: stats.adminMessages, icon: Mail, color: 'from-orange-500 to-red-600' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon size={28} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-5xl font-extrabold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-blue-200 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // Items List
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>

            <div className="overflow-x-auto">
              {itemsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 size={48} className="text-white animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-blue-200">Немає записів</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">Дані</th>
                      {activeTab === 'adminMessages' && (
                        <th className="px-6 py-4 text-left text-sm font-bold text-white">Email</th>
                      )}
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">Дата</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {items.map(item => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-white/5 transition-colors ${
                          activeTab === 'adminMessages' ? 'cursor-pointer' : ''
                        }`}
                        onClick={activeTab === 'adminMessages' ? () => handleViewMessage(item) : undefined}
                      >
                        <td className="px-6 py-4 text-sm text-blue-200 font-mono">
                          {String(item.id).substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {activeTab === 'users' && (
                            <Link
                              to={`/profile/${item.id}`}
                              className="block hover:opacity-80 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-bold flex items-center gap-2">
                                {item.full_name || 'Без імені'}
                                <ExternalLink size={14} className="text-blue-300" />
                              </div>
                              <div className="text-blue-200 text-xs">{item.email}</div>
                            </Link>
                          )}
                          {activeTab === 'jobs' && (
                            <Link
                              to={`/jobs/${item.id}`}
                              className="block hover:opacity-80 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-bold flex items-center gap-2">
                                {item.title}
                                <ExternalLink size={14} className="text-blue-300" />
                              </div>
                              <div className="text-blue-200 text-xs">{item.company}</div>
                            </Link>
                          )}
                          {activeTab === 'housing' && (
                            <Link
                              to={`/housing/${item.id}`}
                              className="block hover:opacity-80 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-bold flex items-center gap-2">
                                {item.title}
                                <ExternalLink size={14} className="text-blue-300" />
                              </div>
                              <div className="text-blue-200 text-xs">€{item.price}</div>
                            </Link>
                          )}
                          {activeTab === 'services' && (
                            <Link
                              to={`/services/${item.id}`}
                              className="block hover:opacity-80 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-bold flex items-center gap-2">
                                {item.name}
                                <ExternalLink size={14} className="text-blue-300" />
                              </div>
                              <div className="text-blue-200 text-xs">{item.profession}</div>
                            </Link>
                          )}
                          {activeTab === 'forum' && (
                            <Link
                              to="/forum"
                              className="block hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Можна додати логіку для автоматичного відкриття поста на форумі
                              }}
                            >
                              <div className="font-bold flex items-center gap-2">
                                {item.title}
                                <ExternalLink size={14} className="text-blue-300" />
                              </div>
                              <div className="text-blue-200 text-xs line-clamp-1">{item.content}</div>
                            </Link>
                          )}
                          {activeTab === 'messages' && (
                            <div>
                              <div className="font-bold">{item.author_name}</div>
                              <div className="text-blue-200 text-xs line-clamp-1">{item.content}</div>
                            </div>
                          )}
                          {activeTab === 'adminMessages' && (
                            <div>
                              <div className="font-bold">{item.user_name || 'Анонім'}</div>
                              <div className="text-blue-200 text-xs font-semibold mb-1">{item.subject}</div>
                              <div className="text-blue-200 text-xs line-clamp-2">{item.message}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  item.status === 'new' ? 'bg-yellow-500/20 text-yellow-300' :
                                  item.status === 'read' ? 'bg-blue-500/20 text-blue-300' :
                                  item.status === 'replied' ? 'bg-green-500/20 text-green-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {item.status === 'new' ? 'Нове' :
                                   item.status === 'read' ? 'Прочитано' :
                                   item.status === 'replied' ? 'Відповідь' :
                                   'Вирішено'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  item.message_type === 'account_deletion_request' ? 'bg-red-500/30 text-red-200' :
                                  item.message_type === 'bug' ? 'bg-red-500/20 text-red-300' :
                                  item.message_type === 'suggestion' ? 'bg-purple-500/20 text-purple-300' :
                                  item.message_type === 'feedback' ? 'bg-blue-500/20 text-blue-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {item.message_type === 'account_deletion_request' ? 'Видалення акаунту' :
                                   item.message_type === 'bug' ? 'Баг' :
                                   item.message_type === 'suggestion' ? 'Пропозиція' :
                                   item.message_type === 'feedback' ? 'Відгук' :
                                   'Загальне'}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        {activeTab === 'adminMessages' && (
                          <td className="px-6 py-4 text-sm text-blue-200">
                            {item.user_email || '—'}
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm text-blue-200">
                          {new Date(item.created_at).toLocaleDateString('uk-UA')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {activeTab === 'adminMessages' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewMessage(item);
                                }}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors"
                                title="Переглянути повідомлення"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(activeTab, item.id);
                              }}
                              disabled={deletingId === item.id}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Видалити"
                            >
                              {deletingId === item.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Message Modal */}
        <AnimatePresence>
          {showMessageModal && selectedMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setShowMessageModal(false);
                setSelectedMessage(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-azure-blue to-blue-600 text-white p-6 rounded-t-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Mail size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Повідомлення від користувача</h2>
                        <p className="text-blue-100 text-sm">Детальна інформація</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowMessageModal(false);
                        setSelectedMessage(null);
                      }}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {/* Status badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedMessage.status === 'new' ? 'bg-yellow-500/30 text-yellow-200' :
                      selectedMessage.status === 'read' ? 'bg-blue-500/30 text-blue-200' :
                      selectedMessage.status === 'replied' ? 'bg-green-500/30 text-green-200' :
                      'bg-gray-500/30 text-gray-200'
                    }`}>
                      {selectedMessage.status === 'new' ? 'Нове' :
                       selectedMessage.status === 'read' ? 'Прочитано' :
                       selectedMessage.status === 'replied' ? 'Відповідь' :
                       'Вирішено'}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedMessage.message_type === 'account_deletion_request' ? 'bg-red-500/40 text-red-100' :
                      selectedMessage.message_type === 'bug' ? 'bg-red-500/30 text-red-200' :
                      selectedMessage.message_type === 'suggestion' ? 'bg-purple-500/30 text-purple-200' :
                      selectedMessage.message_type === 'feedback' ? 'bg-blue-500/30 text-blue-200' :
                      'bg-gray-500/30 text-gray-200'
                    }`}>
                      {selectedMessage.message_type === 'account_deletion_request' ? 'Видалення акаунту' :
                       selectedMessage.message_type === 'bug' ? 'Баг' :
                       selectedMessage.message_type === 'suggestion' ? 'Пропозиція' :
                       selectedMessage.message_type === 'feedback' ? 'Відгук' :
                       'Загальне'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Sender Info */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                      <User size={16} />
                      Відправник
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Ім'я</div>
                        <div className="text-white font-semibold">{selectedMessage.user_name || 'Анонім'}</div>
                      </div>
                      {selectedMessage.user_email && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Email</div>
                          <div className="text-blue-300">{selectedMessage.user_email}</div>
                        </div>
                      )}
                      {selectedMessage.user_id && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">ID користувача</div>
                          <div className="text-gray-400 font-mono text-xs">{selectedMessage.user_id}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Тема
                    </h3>
                    <div className="text-white font-bold text-lg">{selectedMessage.subject}</div>
                  </div>

                  {/* Message */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Повідомлення
                    </h3>
                    <div className="text-white whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</div>
                  </div>

                  {/* Date */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                      <Calendar size={16} />
                      Дата відправки
                    </h3>
                    <div className="text-gray-300">
                      {new Date(selectedMessage.created_at).toLocaleString('uk-UA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Admin Notes (if exists) */}
                  {selectedMessage.admin_notes && (
                    <div className="bg-yellow-500/10 rounded-2xl p-4 border border-yellow-500/20">
                      <h3 className="text-sm font-semibold text-yellow-400 mb-2">Примітки адміна</h3>
                      <div className="text-yellow-200 whitespace-pre-wrap">{selectedMessage.admin_notes}</div>
                    </div>
                  )}

                  {/* Info about manual deletion */}
                  {selectedMessage.message_type === 'account_deletion_request' && (
                    <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                      <h3 className="text-sm font-semibold text-red-300 mb-2">Запит на видалення акаунту</h3>
                      <p className="text-gray-300 text-sm mb-3">
                        Адміністратор має видалити цей акаунт вручну в Supabase Dashboard (Authentication -> Users).
                      </p>
                      <div className="bg-black/30 p-3 rounded-lg font-mono text-xs text-blue-200 break-all mb-3">
                        Email: {selectedMessage.user_email || 'не вказано'}<br/>
                        ID: {selectedMessage.user_id}
                      </div>
                      <button
                        onClick={() => handleApproveDeletion(selectedMessage)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded-xl transition-colors text-sm font-medium"
                      >
                        Як видалити?
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <span className="text-sm text-gray-400">Змінити статус:</span>
                    <div className="flex gap-2 flex-wrap">
                      {selectedMessage.status !== 'read' && (
                        <button
                          onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'read')}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-colors text-sm font-medium"
                        >
                          Відмітити як прочитане
                        </button>
                      )}
                      {selectedMessage.status !== 'replied' && (
                        <button
                          onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'replied')}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl transition-colors text-sm font-medium"
                        >
                          Відмітити як відповідь
                        </button>
                      )}
                      {selectedMessage.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'resolved')}
                          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl transition-colors text-sm font-medium"
                        >
                          Відмітити як вирішене
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
