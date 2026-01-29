import { motion } from 'framer-motion';
import HeroCard from '../components/HeroCard';
import Jobs from '../components/Jobs';
import Housing from '../components/Housing';
import CommunityPulse from '../components/CommunityPulse';
import Districts from '../components/Districts';
import ServicesCard from '../components/ServicesCard';

export default function Dashboard() {
  return (
    <div className="pt-0 md:pt-12 pb-4 md:pb-8 px-0 md:px-4 lg:px-8 min-h-screen md:min-h-0 bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-[1600px] mx-auto"
      >
        {/* Mobile: Hero takes full width, Desktop: Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-0 md:gap-4">
          {/* Row 1: Top - Hero + Services Guide */}
          {/* Hero Card - Full width on mobile, 2 cols on desktop */}
          <div className="md:col-span-2">
            <div className="p-4 md:p-0">
              <HeroCard />
            </div>
          </div>

          {/* Берлінський Гід - Large (2 cols) */}
          <div className="md:col-span-2 mt-4 md:mt-0">
            <ServicesCard />
          </div>

          {/* Row 2: Market - Jobs + Housing */}
          {/* Jobs - Medium (2 cols) */}
          <div className="md:col-span-2">
            <Jobs />
          </div>

          {/* Housing - Medium (2 cols) */}
          <div className="md:col-span-2">
            <Housing />
          </div>

          {/* Row 3: Community & Info */}
          {/* Community Pulse - Large (4 cols) */}
          <div className="md:col-span-4">
            <CommunityPulse />
          </div>

          {/* Row 4: Bottom - Districts Full Width */}
          {/* Districts - Horizontal full width (4 cols) */}
          <div className="md:col-span-4">
            <Districts />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
