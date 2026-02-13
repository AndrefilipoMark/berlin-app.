import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, MapPin, Loader2, Clock, Euro } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getJobs } from '../lib/supabase';
import { onEvent, Events } from '../lib/events';

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadJobs();
    
    // Слухаємо події додавання нових вакансій
    const unsubscribe = onEvent(Events.JOB_ADDED, () => {
      loadJobs();
    });
    
    return unsubscribe;
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(Array.isArray(data) ? data.slice(0, 2) : []);
      setTotalCount(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      console.warn('Error loading jobs:', e);
      setJobs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min, max) => {
    if (min && min > 0 && max && max > 0) {
      if (min >= 1000 || max >= 1000) {
        return `€${(min / 1000).toFixed(0)}-${(max / 1000).toFixed(0)}K`;
      }
      return `€${min}-${max}`;
    } else if (min && min > 0) {
      if (min >= 1000) {
        return `від €${(min / 1000).toFixed(0)}K`;
      }
      return `від €${min}`;
    } else if (max && max > 0) {
      if (max >= 1000) {
        return `до €${(max / 1000).toFixed(0)}K`;
      }
      return `до €${max}`;
    }
    return 'Договірна';
  };

  const getEmploymentLabel = (t) => {
    const l = { 'full-time': 'Повна', 'part-time': 'Часткова', 'contract': 'Контракт', 'internship': 'Стажування' };
    return l[t] || t || '—';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileHover={{ y: -4 }}
      className="relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 aspect-square flex-shrink-0 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center shadow-sm">
              <Briefcase size={22} className="text-primary animate-heartbeat" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Вакансії</h2>
              <p className="text-xs text-gray-500">
                {loading ? 'Завантаження...' : `${totalCount} ${totalCount === 1 ? 'позиція' : totalCount < 5 ? 'позиції' : 'позицій'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {jobs.length > 0 && (
              <div className="text-[10px] font-bold text-gray-900 bg-accent px-2.5 py-1 rounded-full border border-yellow-400/50 shadow-sm uppercase tracking-wide">
                Нові
              </div>
            )}
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp size={18} className="text-primary" />
            </motion.div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="p-3 rounded-xl bg-gray-50/50 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Поки немає вакансій. Будьте першим хто додасть!
            </div>
          ) : (
            jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                whileHover={{ x: -3 }}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="p-3 rounded-xl bg-white border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors flex-1 line-clamp-1">
                    {job.title}
                  </h3>
                  {job.category && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded border border-gray-200">
                      {job.category}
                    </span>
                  )}
                </div>
                {job.company && (
                  <p className="text-xs text-gray-500 line-clamp-1 mb-1">{job.company}</p>
                )}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-primary/70 flex-shrink-0" />
                      {job.location?.split(',')[0] || job.location || '—'}
                    </span>
                    {job.employment_type && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-primary/70 flex-shrink-0" />
                        {getEmploymentLabel(job.employment_type)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-primary flex-shrink-0">
                    <Euro size={11} />
                    {formatSalary(job.salary_min, job.salary_max)}
                  </div>
                </div>
                {job.description && (
                  <p className="text-[13px] text-gray-600 leading-snug line-clamp-3">
                    {job.description}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate('/jobs');
          }}
          disabled={loading}
          className="w-full py-2.5 bg-accent text-gray-900 text-sm font-bold rounded-xl hover:bg-yellow-500 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Завантаження...
            </>
          ) : (
            <>Всі {totalCount} {totalCount === 1 ? 'вакансія' : totalCount < 5 ? 'вакансії' : 'вакансій'} →</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
