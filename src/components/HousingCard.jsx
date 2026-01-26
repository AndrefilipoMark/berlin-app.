import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Euro, Users } from 'lucide-react';

export default function HousingCard({
  item,
  index = 0,
  profile,
  categoryLabel,
  TypeIcon,
  getTypeLabel,
  getTimeAgo,
  onAuthorClick,
}) {
  const navigate = useNavigate();
  const authorName = profile?.full_name ?? item.author_name ?? 'Користувач';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/housing/${item.id}`)}
      className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer group flex flex-col h-full hover:scale-[1.01] overflow-hidden"
    >
      <div className="flex justify-between items-start gap-4 mb-1">
        <h3 className="text-xl font-extrabold text-gray-900 leading-tight max-w-[70%] line-clamp-2 group-hover:text-amber-600 transition-colors">
          {item.title}
        </h3>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-xl border border-amber-100">
          {TypeIcon && <TypeIcon size={14} className="text-amber-500" />}
          {categoryLabel || '—'}
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {(item.district || item.address) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{item.district || item.address?.split(',')[0] || item.address}</span>
          </div>
        )}

        {(item.user_id || item.author_name) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {item.user_id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuthorClick?.(item.user_id);
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
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-vibrant-yellow to-amber-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {(authorName || 'К').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate font-medium group-hover/author:text-amber-600 group-hover/author:underline transition-colors">
                  {authorName}
                </span>
              </button>
            ) : (
              <>
                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs font-bold">
                  {(authorName || 'К').charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{authorName}</span>
              </>
            )}
          </div>
        )}

        {item.price != null && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-bold">
            <Euro size={14} />
            від €{item.price}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {item.type && getTypeLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold">
              {TypeIcon && <TypeIcon size={12} className="text-amber-500" />}
              {getTypeLabel(item.type)}
            </span>
          )}
          {item.rooms && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
              <Users size={12} />
              {item.rooms} к.
            </span>
          )}
          {item.district && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
              <MapPin size={12} />
              {item.district}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-gray-600 leading-relaxed line-clamp-4 text-sm pt-1">
            "{item.description}"
          </p>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {getTimeAgo ? getTimeAgo(item.created_at) : ''}
        </span>
        {item.size && (
          <span className="text-xs text-gray-400">{item.size}м²</span>
        )}
      </div>
    </motion.article>
  );
}
