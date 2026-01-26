import { motion } from 'framer-motion';
import HeroCard from '../components/HeroCard';
import Jobs from '../components/Jobs';
import Housing from '../components/Housing';
import CommunityPulse from '../components/CommunityPulse';
import Districts from '../components/Districts';
import ServicesCard from '../components/ServicesCard';

export default function Dashboard() {
  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-[1600px] mx-auto"
      >
        {/* Premium Bento Grid Layout - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-4">
          {/* Row 1: Top - Hero + Services Guide */}
          {/* Hero Card - Large (2 cols) */}
          <div className="md:col-span-2">
            <HeroCard />
          </div>

          {/* Берлінський Гід - Large (2 cols) */}
          <div className="md:col-span-2">
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
