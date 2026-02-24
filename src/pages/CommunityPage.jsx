import { motion } from 'framer-motion';
import { MessageSquare, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ForumView from '../components/ForumView';
import EventsView from '../components/EventsView';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('discussion'); // 'discussion' | 'events'
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-gray-50/50 to-blue-50/30 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header - Removed as per user request */}
        {/* <div className="mb-8 md:mb-10 text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 md:mb-4"
          >
            Спільнота
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-600 max-w-2xl"
          >
            Обговорюйте важливі теми, знаходьте відповіді та долучайтесь до подій української громади.
          </motion.p>
        </div> */}

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex p-1 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl w-full max-w-md mx-auto md:mx-0 shadow-sm">
            <button
              onClick={() => setActiveTab('discussion')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'discussion'
                  ? 'bg-white text-primary shadow-md shadow-blue-900/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <MessageSquare size={18} />
              Обговорення
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'events'
                  ? 'bg-white text-primary shadow-md shadow-blue-900/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <Calendar size={18} />
              Події
            </button>
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'discussion' ? (
            <ForumView />
          ) : (
            <EventsView user={user} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
