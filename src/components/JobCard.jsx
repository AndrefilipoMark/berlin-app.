import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Euro, Clock } from 'lucide-react';

export default function JobCard({
  job,
  index = 0,
  profile,
  categoryLabel,
  CatIcon,
  formatSalary,
  getEmploymentTypeLabel,
  getTimeAgo,
  normalizeLanguageCode,
  onAuthorClick,
}) {
  const navigate = useNavigate();
  const authorName = profile?.full_name ?? job.author_name ?? 'Користувач';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border-2 border-gray-300 hover:border-blue-400 transition-all duration-300 cursor-pointer group flex flex-col h-full hover:scale-[1.01] overflow-hidden"
    >
      {/* Header: Title + Category */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <h3 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight flex-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {job.title}
        </h3>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 bg-blue-50 text-azure-blue text-xs font-semibold rounded-xl border border-blue-100">
          {CatIcon && <CatIcon size={13} className="text-azure-blue" />}
          <span className="hidden sm:inline">{categoryLabel}</span>
        </span>
      </div>

      {job.company && (
        <p className="text-sm text-gray-500 font-medium truncate mb-3">{job.company}</p>
      )}

      <div className="space-y-3 flex-1">
        {/* Salary Badge - Prominent */}
        {formatSalary && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold border border-blue-100">
            <Euro size={16} className="text-blue-500" />
            <span>{formatSalary(job.salary_min, job.salary_max)}</span>
          </div>
        )}

        {/* Location with colored icon */}
        {job.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-blue-500 flex-shrink-0" />
            <span className="line-clamp-1">{job.location?.split(',')[0] || job.location}</span>
          </div>
        )}

        {/* Employment Type with colored icon */}
        {job.employment_type && getEmploymentTypeLabel && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} className="text-blue-500 flex-shrink-0" />
            <span>{getEmploymentTypeLabel(job.employment_type)}</span>
          </div>
        )}

        {/* Author - Clickable Avatar */}
        {(job.user_id || job.author_name) && (
          <div className="flex items-center gap-2 text-sm">
            {job.user_id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuthorClick?.(job.user_id);
                }}
                className="flex items-center gap-2 min-w-0 group/author text-left hover:bg-blue-50/50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 border-2 border-blue-100 group-hover/author:border-blue-300 transition-colors"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
                    {(authorName || 'К').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate font-medium text-gray-700 group-hover/author:text-blue-600 transition-colors">
                  {authorName}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs font-bold">
                  {(authorName || 'К').charAt(0).toUpperCase()}
                </span>
                <span className="truncate text-gray-600">{authorName}</span>
              </div>
            )}
          </div>
        )}

        {/* Description - Limited to 3 lines on mobile */}
        {job.description && (
          <p className="text-gray-600 leading-relaxed line-clamp-3 md:line-clamp-4 text-sm pt-1">
            {job.description}
          </p>
        )}
      </div>

      {/* Languages */}
      {Array.isArray(job.languages) && job.languages.length > 0 && normalizeLanguageCode && (
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
          {job.languages.map((lang, idx) => {
            const code = normalizeLanguageCode(lang);
            return (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded border border-gray-200"
              >
                {code}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer: Time */}
      <div className="pt-3 mt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {getTimeAgo ? getTimeAgo(job.created_at) : ''}
        </span>
      </div>
    </motion.article>
  );
}
