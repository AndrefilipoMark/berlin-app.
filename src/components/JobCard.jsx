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
      className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer group flex flex-col h-full hover:scale-[1.01] overflow-hidden"
    >
      <div className="flex justify-between items-start gap-4 mb-1">
        <h3 className="text-xl font-extrabold text-gray-900 leading-tight max-w-[70%] line-clamp-2 group-hover:text-blue-600 transition-colors">
          {job.title}
        </h3>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-xl border border-blue-100">
          {CatIcon && <CatIcon size={14} className="text-blue-500" />}
          {categoryLabel}
        </span>
      </div>

      {job.company && (
        <p className="text-sm text-gray-500 font-medium truncate mb-2">{job.company}</p>
      )}

      <div className="space-y-3 flex-1">
        {job.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{job.location?.split(',')[0] || job.location}</span>
          </div>
        )}

        {(job.user_id || job.author_name) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {job.user_id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuthorClick?.(job.user_id);
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
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {(authorName || 'К').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate font-medium group-hover/author:text-blue-600 group-hover/author:underline transition-colors">
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

        {formatSalary && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">
            <Euro size={14} />
            {formatSalary(job.salary_min, job.salary_max)}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {job.employment_type && getEmploymentTypeLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
              <Clock size={12} />
              {getEmploymentTypeLabel(job.employment_type)}
            </span>
          )}
        </div>

        {job.description && (
          <p className="text-gray-600 leading-relaxed line-clamp-4 text-sm pt-1">
            "{job.description}"
          </p>
        )}
      </div>

      {Array.isArray(job.languages) && job.languages.length > 0 && normalizeLanguageCode && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {job.languages.map((lang, idx) => {
            const code = normalizeLanguageCode(lang);
            return (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded"
              >
                {code}
              </span>
            );
          })}
        </div>
      )}

      <div className="pt-4 mt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {getTimeAgo ? getTimeAgo(job.created_at) : ''}
        </span>
      </div>
    </motion.article>
  );
}
