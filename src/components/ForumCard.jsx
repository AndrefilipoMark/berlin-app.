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
      className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 cursor-pointer group flex flex-col h-full hover:scale-[1.01] overflow-hidden"
    >
      {/* Header: Title + Category */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <h3 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight flex-1 line-clamp-2 group-hover:text-green-600 transition-colors">
          {post.title}
        </h3>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-xl border border-green-100">
          {CatIcon && <CatIcon size={13} className="text-green-500" />}
          <span className="hidden sm:inline">{categoryLabel}</span>
        </span>
      </div>

      {isHot && (
        <span className="inline-block mb-2 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-100">
          🔥 HOT
        </span>
      )}

      <div className="space-y-3 flex-1">
        {/* Author - Clickable Avatar */}
        {(post.user_id || post.author_name) && (
          <div className="flex items-center gap-2 text-sm">
            {post.user_id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuthorClick?.(post.user_id);
                }}
                className="flex items-center gap-2 min-w-0 group/author text-left hover:bg-green-50/50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 border-2 border-green-100 group-hover/author:border-green-300 transition-colors"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
                    {(authorName || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate font-medium text-gray-700 group-hover/author:text-green-600 transition-colors">
                  {authorName}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs font-bold">
                  {(authorName || '?').charAt(0).toUpperCase()}
                </span>
                <span className="truncate text-gray-600">{authorName}</span>
              </div>
            )}
          </div>
        )}

        {/* Description - Limited to 3 lines on mobile */}
        {post.content && (
          <p className="text-gray-600 leading-relaxed line-clamp-3 md:line-clamp-4 text-sm pt-1">
            {post.content}
          </p>
        )}
      </div>

      {/* Footer: Time + Stats */}
      <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
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
            <MessageSquare size={12} className="text-green-500" />
            {repliesCount}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
