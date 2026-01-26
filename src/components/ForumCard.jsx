import { motion } from 'framer-motion';
import { MessageSquare, Heart, Loader2 } from 'lucide-react';

export default function ForumCard({
  post,
  index = 0,
  profile,
  categoryLabel,
  CatIcon,
  getTimeAgo,
  onPostClick,
  onLikeClick,
  onAuthorClick,
  isLiked,
  isLiking,
  user,
}) {
  const authorName = profile?.full_name ?? post.author_name ?? 'Анонім';
  const likes = post.likes_count ?? 0;
  const repliesCount = post.replies_count ?? 0;
  const isHot = (post.views_count ?? post.views ?? 0) > 50;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onPostClick?.(post)}
      className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer group flex flex-col h-full hover:scale-[1.01] overflow-hidden"
    >
      <div className="flex justify-between items-start gap-4 mb-1">
        <h3 className="text-xl font-extrabold text-gray-900 leading-tight max-w-[70%] line-clamp-2 group-hover:text-green-600 transition-colors">
          {post.title}
        </h3>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-xl border border-green-100">
          {CatIcon && <CatIcon size={14} className="text-green-500" />}
          {categoryLabel}
        </span>
      </div>

      {isHot && (
        <span className="inline-block mt-1 mb-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[9px] font-bold uppercase tracking-wider">
          HOT
        </span>
      )}

      <div className="space-y-3 flex-1">
        {(post.user_id || post.author_name) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {post.user_id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuthorClick?.(post.user_id);
                }}
                className="flex items-center gap-2 min-w-0 group/author text-left"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {(authorName || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate font-medium group-hover/author:text-green-600 group-hover/author:underline transition-colors">
                  {authorName}
                </span>
              </button>
            ) : (
              <>
                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs font-bold">
                  {(authorName || '?').charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{authorName}</span>
              </>
            )}
          </div>
        )}

        {post.content && (
          <p className="text-gray-600 leading-relaxed line-clamp-4 text-sm pt-1">
            "{post.content}"
          </p>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-gray-400">
          {getTimeAgo ? getTimeAgo(post.created_at) : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => onLikeClick?.(post.id, e)}
            disabled={!user || isLiking}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              user
                ? isLiked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-default'
            }`}
          >
            {isLiking ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} />
            )}
            <span>{likes}</span>
          </button>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <MessageSquare size={12} />
            {repliesCount}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
