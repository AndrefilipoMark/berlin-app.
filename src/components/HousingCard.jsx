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
      className="bg-white rounded-3xl p-0 overflow-hidden shadow-sm hover:shadow-md border border-gray-200 hover:border-primary/50 transition-all duration-300 cursor-pointer group flex flex-col h-full hover:scale-[1.01]"
    >
      {Array.isArray(item.images) && item.images.length > 0 ? (
        <div className="aspect-[16/10] w-full flex-shrink-0 overflow-hidden rounded-t-3xl bg-gray-100">
          <img
            src={item.images[0]}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : null}
      <div className="p-5 md:p-6 flex flex-col flex-1">
      {/* Header: Title + Category */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <h3 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight flex-1 line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl border border-gray-200">
          {TypeIcon && <TypeIcon size={13} className="text-primary" />}
          <span className="hidden sm:inline">{categoryLabel || '—'}</span>
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {/* Price Badge - Prominent */}
        {item.price != null && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl text-sm font-bold border border-primary/10">
            <Euro size={16} className="text-primary" />
            <span>від €{item.price}</span>
          </div>
        )}

        {/* Location with colored icon */}
        {(item.district || item.address) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-primary/70 flex-shrink-0" />
            <span className="line-clamp-1">{item.district || item.address?.split(',')[0] || item.address}</span>
          </div>
        )}

        {/* Details: Rooms, Size */}
        <div className="flex flex-wrap gap-2">
          {item.rooms && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold border border-gray-200">
              <Users size={14} className="text-gray-400" />
              <span>{item.rooms} кімнат</span>
            </div>
          )}
          {item.size && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold border border-gray-200">
              <span>{item.size}м²</span>
            </div>
          )}
        </div>

        {/* Author - Clickable Avatar */}
        {(item.user_id || item.author_name) && (
          <div className="flex items-center gap-2 text-sm">
            {item.user_id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuthorClick?.(item.user_id);
                }}
                className="flex items-center gap-2 min-w-0 group/author text-left hover:bg-primary/5 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 border-2 border-primary/10 group-hover/author:border-primary/30 transition-colors"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-xs font-bold shadow-sm">
                    {(authorName || 'К').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate font-medium text-gray-700 group-hover/author:text-primary transition-colors">
                  {authorName}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs font-bold">
                  {(authorName || 'К').charAt(0).toUpperCase()}
                </span>
                <span className="truncate text-gray-600">{authorName}</span>
              </div>
            )}
          </div>
        )}

        {/* Description - Limited to 3 lines on mobile */}
        {item.description && (
          <p className="text-gray-600 leading-relaxed line-clamp-3 md:line-clamp-4 text-sm pt-1">
            {item.description}
          </p>
        )}
      </div>

      {/* Footer: Time + Size */}
      <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {getTimeAgo ? getTimeAgo(item.created_at) : ''}
        </span>
        {item.size && (
          <span className="text-xs text-gray-400">{item.size}м²</span>
        )}
      </div>
      </div>
    </motion.article>
  );
}
