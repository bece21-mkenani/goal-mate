import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import React, { createContext, useEffect, useState } from 'react';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import AuthForm from './components/AuthForm';
import Chat from './components/Chat';
import Flashcard from './components/Flashcard';
import Navbar from './components/Navbar';
import ReviewSession from './components/ReviewSession';
import StudyPlan from './components/StudyPlan';
import StudySessionTimer from './components/StudySessionTimer';
import UserProfile from './components/UserProfile';
import { SocketProvider } from './contexts/SocketContext';
import StudyGroups from './components/StudyGroups'; 
import GroupChat from './components/GroupChat';
import AdminDashboard from './components/AdminDashboard'; 
import ToastProvider from './components/ToastProvider';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

/*==== APP COMPONENT ====*/
type Page = 'chat' | 'study-plan' | 'flashcard' | 'profile' | 'timer'| 'analytics'| 'groups' | 'admin';

type SelectedGroup = {
  id: string;
  roomName: string;
} | null;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup>(null);
  const [isAdmin, setIsAdmin] = useState(false); 

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  /*==== TOKEN VALIDDATION ====*/
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${apiUrl}/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(!!res.data.user);
        setIsAdmin(res.data.user?.is_admin || false); // --- NEW ---
      } catch (err: any) {
        console.error('Validate Token Error:', err.response?.data || err.message);
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };
    validateToken();
  }, []);

  /*==== AUTH HANDLERS ===*/
  const handleAuthSuccess = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsAuthenticated(false);
      setIsAdmin(false);
      return;
    }
    try {
      const res = await await axios.get(`${apiUrl}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsAuthenticated(!!res.data.user);
      setIsAdmin(res.data.user?.is_admin || false); // --- NEW ---
    } catch (err: any) {
      console.error('Auth Success Validate Error:', err.response?.data || err.message);
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  };

  /* === LOGOUT HANDELER ====*/
  const handleLogout = async () => {
    try {
      await axios.post(`${apiUrl}/auth/signout`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
    } catch (err: any) {
      console.error('Logout Error:', err.response?.data || err.message);
    }
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setIsAdmin(false); 
    setCurrentPage('chat');
    setIsMobileMenuOpen(false);
    setIsReviewing(false);
    setSelectedGroup(null);
  };

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    setIsReviewing(false);
    setSelectedGroup(null);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('chat');
    setIsReviewing(false);
    setSelectedGroup(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {isAuthenticated ? (
        <SocketProvider>
          <>
            <Navbar
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onLogout={handleLogout}
              onToggleTheme={toggleTheme}
              theme={theme}
              isMobileMenuOpen={isMobileMenuOpen}
              onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              isAdmin={isAdmin} 
            />
            
            <main className="pt-16">
              <div className="p-4 sm:p-6 md:p-8">
                <AnimatePresence mode="wait">
                {currentPage === 'chat' && (
                  <motion.div key="chat"  >
                    <Chat />
                  </motion.div>
                )}
                {currentPage === 'analytics' && (
                  <motion.div key="analytics" >
                    <AdvancedAnalytics />
                  </motion.div>
                )}
                {currentPage === 'study-plan' && (
                  <motion.div key="study-plan"  >
                    <StudyPlan />
                  </motion.div>
                )}
                {currentPage === 'flashcard' && (
                  <div key="flashcard-page">
                    <AnimatePresence mode="wait">
                      {!isReviewing ? (
                        <motion.div key="flashcard-main" >
                          <Flashcard onStartReview={() => setIsReviewing(true)} />
                        </motion.div>
                      ) : (
                        <motion.div key="flashcard-review"  >
                          <ReviewSession onSessionComplete={() => setIsReviewing(false)} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {currentPage === 'timer' && (
                  <motion.div key="timer" >
                    <StudySessionTimer />
                  </motion.div>
                )}
                {currentPage === 'groups' && (
                  <div key="groups-page">
                    <AnimatePresence mode="wait">
                      {!selectedGroup ? (
                        <motion.div key="group-lobby" >
                          <StudyGroups 
                            onSelectGroup={(groupId) => setSelectedGroup({ id: groupId, roomName: 'general' })}
                            onSelectAdminRoom={(groupId, roomName) => setSelectedGroup({ id: groupId, roomName: roomName })}
                          />
                        </motion.div>
                      ) : (
                        <motion.div key="group-chat" >
                          <GroupChat
                            groupId={selectedGroup.id}
                            roomName={selectedGroup.roomName}
                            onBack={() => setSelectedGroup(null)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )} 
                {currentPage === 'profile' && (
                  <motion.div key="profile" >
                    <UserProfile onBack={handleBackToDashboard} />
                  </motion.div>
                )}
                {currentPage === 'admin' && (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AdminDashboard />
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </main>
          </>
        </SocketProvider>
        ) : (
          <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          </div>
        )}
      </div>
      <ToastProvider /> 
    </ThemeContext.Provider>
  );
};

export default App;