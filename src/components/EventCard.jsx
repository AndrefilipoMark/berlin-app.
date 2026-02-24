import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Check, HelpCircle, XCircle, Clock, User, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { updateEventRSVP } from '../lib/supabase';

export default function EventCard({ event, user, onRSVP, onAuthorClick, onClick, onEdit, onDelete, isAdmin }) {
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(event.rsvp_status || null); // 'going', 'maybe', 'not_going'
  const [goingCount, setGoingCount] = useState(event.going_count || 0);
  const [maybeCount, setMaybeCount] = useState(event.maybe_count || 0);

  const isAuthor = user?.id === event.user_id;
  const canEdit = isAuthor || isAdmin;

  const handleRSVP = async (status, e) => {
    e.stopPropagation();
    if (!user) {
      onRSVP('auth_required'); // Callback to trigger login modal
      return;
    }
    if (rsvpStatus === status) return;

    setRsvpLoading(true);
    try {
      await updateEventRSVP(event.id, user.id, status);
      
      // Optimistic update
      // Decrement previous
      if (rsvpStatus === 'going') setGoingCount(c => Math.max(0, c - 1));
      if (rsvpStatus === 'maybe') setMaybeCount(c => Math.max(0, c - 1));
      
      // Increment new
      if (status === 'going') setGoingCount(c => c + 1);
      if (status === 'maybe') setMaybeCount(c => c + 1);
      
      setRsvpStatus(status);
      onRSVP(status); // Notify parent if needed
    } catch (e) {
      console.error('RSVP error:', e);
      alert('Помилка при оновленні статусу');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(event);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Ви впевнені, що хочете видалити цю подію?')) {
      onDelete(event.id);
    }
  };

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(event)}
      className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
      {/* Image */}
      <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <Calendar size={48} className="text-primary/20" />
          </div>
        )}
        
        {/* Author Badge */}
        {event.author && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (onAuthorClick) onAuthorClick(event.user_id);
            }}
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10 cursor-pointer hover:bg-white transition-colors"
          >
            {event.author.avatar_url ? (
              <img 
                src={event.author.avatar_url} 
                alt={event.author.full_name} 
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                <User size={12} className="text-primary" />
              </div>
            )}
            <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate">
              {event.author.full_name || 'Невідомий'}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          {goingCount > 0 && (
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-green-600 shadow-sm flex items-center gap-1">
              <Check size={12} strokeWidth={3} />
              {goingCount}
            </div>
          )}
          {maybeCount > 0 && (
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-amber-600 shadow-sm flex items-center gap-1">
              <HelpCircle size={12} strokeWidth={3} />
              {maybeCount}
            </div>
          )}
        </div>
        
        {/* Admin/Author Actions */}
        {canEdit && (
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleEdit}
              className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-sm hover:text-primary transition-colors"
              title="Редагувати"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-sm hover:text-red-600 transition-colors"
              title="Видалити"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">
            {event.title}
          </h3>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} className="text-primary flex-shrink-0" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={16} className="text-primary flex-shrink-0" />
              {event.map_link ? (
                <a 
                  href={event.map_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {event.location}
                </a>
              ) : (
                <span className="truncate">{event.location}</span>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 line-clamp-3 mb-5 flex-1">
          {event.description}
        </p>

        {/* RSVP Actions */}
        <div className="pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={(e) => handleRSVP('going', e)}
              disabled={rsvpLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                rsvpStatus === 'going' 
                  ? 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1' 
                  : 'bg-slate-50 text-slate-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <Check size={14} />
              Піду
            </button>
            <button
              onClick={(e) => handleRSVP('maybe', e)}
              disabled={rsvpLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                rsvpStatus === 'maybe' 
                  ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500 ring-offset-1' 
                  : 'bg-slate-50 text-slate-600 hover:bg-yellow-50 hover:text-yellow-700'
              }`}
            >
              <HelpCircle size={14} />
              Може
            </button>
            <button
              onClick={(e) => handleRSVP('not_going', e)}
              disabled={rsvpLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                rsvpStatus === 'not_going' 
                  ? 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-1' 
                  : 'bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <XCircle size={14} />
              Ні
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
