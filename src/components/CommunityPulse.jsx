import { motion } from 'framer-motion';
import { MessageSquare, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getForumPosts } from '../lib/supabase';
import { onEvent, Events } from '../lib/events';

export default function CommunityPulse() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
    
    // Слухаємо події додавання нових постів
    const unsubscribe = onEvent(Events.FORUM_POST_ADDED, () => {
      loadPosts();
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [posts.length]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getForumPosts();
      setPosts(Array.isArray(data) ? data.slice(0, 4) : []);
    } catch (e) {
      console.warn('Error loading posts:', e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'щойно';
    if (diffInMinutes < 60) return `${diffInMinutes} хв тому`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} год тому`;
    return `${Math.floor(diffInMinutes / 1440)} дн тому`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate('/forum')}
      className="relative bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-30" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center shadow-sm">
              <TrendingUp size={22} className="text-primary animate-heartbeat" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Community Pulse</h2>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                Live Feed
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-primary rounded-full inline-block"
                />
              </p>
            </div>
          </div>
        </div>

        <div className="relative perspective-1000" style={{ minHeight: '280px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-azure-blue mx-auto mb-3" />
                <p className="text-sm text-gray-500">Завантаження постів...</p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <p className="text-sm mb-2">Поки немає постів</p>
                <p className="text-xs">Будьте першим хто запитає!</p>
              </div>
            </div>
          ) : (
            posts.map((item, index) => {
              const isActive = index === currentIndex;
              const offset = Math.abs(index - currentIndex);
              const isTrending = item.replies_count > 10;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: offset > 2 ? 0 : 1,
                    y: isActive ? 0 : offset * 8,
                    scale: isActive ? 1 : 1 - offset * 0.03,
                    zIndex: posts.length - offset,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`relative p-5 rounded-2xl border transition-all duration-500 ${
                    isActive 
                      ? 'bg-white border-primary/30 shadow-md' 
                      : 'bg-gray-50/80 border-gray-200/50 shadow-sm'
                  } ${index === 0 ? '' : 'absolute inset-0'}`}
                >
                  {isTrending && isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-accent text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-yellow-400/50 uppercase tracking-wide flex items-center gap-1"
                    >
                      🔥 Trending
                    </motion.div>
                  )}

                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl">{item.author_avatar || '👤'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{item.author_name}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={11} />
                          {getTimeAgo(item.created_at)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-primary text-xs font-bold bg-primary/5 px-3 py-1.5 rounded-full w-fit border border-primary/10">
                    <MessageSquare size={14} />
                    <span>{item.replies_count || 0} відповідей</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {!loading && posts.length > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            {posts.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-gray-200 w-1.5 hover:w-4'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
