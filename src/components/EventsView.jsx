import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Loader2, CalendarPlus } from 'lucide-react';
import { getEvents, deleteEvent, supabase } from '../lib/supabase';
import { ADMIN_EMAILS } from '../lib/constants';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import EventDetailModal from './EventDetailModal';
import UserProfileModal from './UserProfileModal';
import GuestGuard from './GuestGuard';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

export default function EventsView({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGuestGuard, setShowGuestGuard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // New state for details and editing
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        const isUserAdmin = data?.is_admin || ADMIN_EMAILS.includes(user.email);
        setIsAdmin(!!isUserAdmin);
      };
      checkAdmin();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      // Don't set loading to true on background updates if we already have data
      if (events.length === 0) setLoading(true);
      
      const data = await getEvents();
      
      const processedEvents = data.map(event => {
        // Find current user's RSVP status from the pre-fetched event_rsvp array
        const userRsvp = user ? (event.event_rsvp || []).find(r => r.user_id === user.id)?.status : null;
        
        return {
          ...event,
          rsvp_status: userRsvp
        };
      });

      setEvents(processedEvents);
    } catch (e) {
      console.error('Error loading events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Realtime subscription for RSVPs
    const channel = supabase
      .channel('events_view_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_rsvp' },
        () => {
          loadEvents();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCreateClick = () => {
    if (!user) {
      setShowGuestGuard(true);
      return;
    }
    setEditingEvent(null); // Clear editing state
    setShowCreateModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowCreateModal(true);
    setSelectedEvent(null); // Close detail modal if open
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Не вдалося видалити подію');
    }
  };

  return (
    <div className="space-y-6">
      {/* Events Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Завантажуємо події...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Ще немає подій</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-6">
            Станьте першим, хто організує зустріч для українців у Берліні!
          </p>
          <button
            onClick={handleCreateClick}
            className="text-primary font-bold hover:underline"
          >
            Створити подію
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              user={user}
              isAdmin={isAdmin}
              onClick={setSelectedEvent}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onRSVP={(status) => {
                if (status === 'auth_required') setShowGuestGuard(true);
              }}
              onAuthorClick={(userId) => {
                if (!user) {
                  setShowGuestGuard(true);
                  return;
                }
                setSelectedUserId(userId);
                setShowUserModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateEventModal 
          user={user}
          initialData={editingEvent}
          onClose={() => {
            setShowCreateModal(false);
            setEditingEvent(null);
          }}
          onEventCreated={() => {
            loadEvents();
            // Optional: Show success toast
          }}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          user={user}
          isAdmin={isAdmin}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onAuthorClick={(userId) => {
            if (!user) {
              setShowGuestGuard(true);
              return;
            }
            setSelectedEvent(null); // Close detail modal
            setSelectedUserId(userId);
            setShowUserModal(true);
          }}
        />
      )}

      {showGuestGuard && (
        <GuestGuard
          onClose={() => setShowGuestGuard(false)}
          onLogin={() => { setShowGuestGuard(false); setShowLoginModal(true); }}
          onRegister={() => { setShowGuestGuard(false); setShowRegisterModal(true); }}
        />
      )}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
        />
      )}
      
      {showUserModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => { setShowUserModal(false); setSelectedUserId(null); }}
        />
      )}

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleCreateClick}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-2xl transition-all group"
      >
        <CalendarPlus size={28} className="text-white transition-transform group-hover:scale-110" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
