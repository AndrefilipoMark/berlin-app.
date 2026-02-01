import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import FAB from './components/FAB';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import HousingPage from './pages/HousingPage';
import HousingDetailPage from './pages/HousingDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServicesDetailPage from './pages/ServicesDetailPage';
import ForumPage from './pages/ForumPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import ProfileSettings from './pages/ProfileSettings';
import PublicProfile from './pages/PublicProfile';
import MessagesPage from './pages/MessagesPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Impressum from './pages/legal/Impressum';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfUse from './pages/legal/TermsOfUse';

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Dashboard />
          </motion.div>
        } />
        <Route path="/jobs" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <JobsPage />
          </motion.div>
        } />
        <Route path="/jobs/:id" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <JobDetailPage />
          </motion.div>
        } />
        <Route path="/housing" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <HousingPage />
          </motion.div>
        } />
        <Route path="/housing/:id" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <HousingDetailPage />
          </motion.div>
        } />
        <Route path="/services" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ServicesPage />
          </motion.div>
        } />
        <Route path="/services/:id" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ServicesDetailPage />
          </motion.div>
        } />
        <Route path="/forum" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ForumPage />
          </motion.div>
        } />
        <Route path="/chat" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ChatPage />
          </motion.div>
        } />
        <Route path="/profile" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ProfileSettings />
          </motion.div>
        } />
        <Route path="/profile/:id" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <PublicProfile />
          </motion.div>
        } />
        <Route path="/admin" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <AdminPage />
          </motion.div>
        } />
        <Route path="/messages/:userId?" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <MessagesPage />
          </motion.div>
        } />
        <Route path="/impressum" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Impressum />
          </motion.div>
        } />
        <Route path="/privacy" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <PrivacyPolicy />
          </motion.div>
        } />
        <Route path="/terms" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <TermsOfUse />
          </motion.div>
        } />
        <Route path="/reset-password" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ResetPasswordPage />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-gradient-to-br from-soft-sand via-gray-50 to-blue-50/30">
        {/* Navigation Bar */}
        <Navigation />

        {/* Main Content with Animated Routes */}
        <AnimatedRoutes />

        {/* Floating Action Button */}
        <FAB />

        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
