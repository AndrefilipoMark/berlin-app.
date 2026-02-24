import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, User, Edit2, Trash2, Check, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function EventDetailModal({ event, user, onClose, onEdit, onDelete, isAdmin, onAuthorClick }) {
  if (!event) return null;

  const isAuthor = user?.id === event.user_id;
  const canEdit = isAuthor || isAdmin;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('uk-UA', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header Image */}
          <div className="relative h-48 sm:h-64 bg-slate-100 flex-shrink-0">
            {event.image_url ? (
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <Calendar size={64} className="text-primary/20" />
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>

            {/* Author Badge */}
            {event.author && (
              <button
                onClick={() => onAuthorClick && onAuthorClick(event.user_id)}
                className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm hover:bg-white transition-colors cursor-pointer"
              >
                {event.author.avatar_url ? (
                  <img 
                    src={event.author.avatar_url} 
                    alt={event.author.full_name} 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <User size={14} className="text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700">
                  {event.author.full_name || 'Невідомий автор'}
                </span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {event.title}
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-primary" />
                </div>
                <span className="font-medium">{formatDate(event.event_date)}</span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-primary" />
                  </div>
                  {event.map_link ? (
                    <a 
                      href={event.map_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {event.location}
                    </a>
                  ) : (
                    <span className="font-medium">{event.location}</span>
                  )}
                </div>
              )}
            </div>

            <div className="prose prose-slate max-w-none mb-8">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Про подію</h3>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mb-6">
              <div className="px-4 py-2 bg-green-50 rounded-xl flex items-center gap-2 text-green-700 font-bold text-sm">
                <Check size={16} />
                {event.going_count || 0} підуть
              </div>
              <div className="px-4 py-2 bg-amber-50 rounded-xl flex items-center gap-2 text-amber-700 font-bold text-sm">
                <HelpCircle size={16} />
                {event.maybe_count || 0} може
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          {canEdit && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  if (window.confirm('Ви впевнені, що хочете видалити цю подію?')) {
                    onDelete(event.id);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors"
              >
                <Trash2 size={18} />
                Видалити
              </button>
              <button
                onClick={() => onEdit(event)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors shadow-sm"
              >
                <Edit2 size={18} />
                Редагувати
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
