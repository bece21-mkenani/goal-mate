import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Calendar,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sun,
  Timer,
  User,
  Users,
  X
} from 'lucide-react';
import React from 'react';

import { CreditCard as Cards } from 'lucide-react';

type Page = 'chat' | 'study-plan' | 'flashcard' | 'profile'|'timer'| 'analytics'| 'groups' | 'admin';

interface NavbarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  theme: string;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  isAdmin: boolean;
}


type NavItem = {
  id: Page; 
  label: string;
  icon: React.ElementType; 
};

const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onPageChange,
  onLogout,
  onToggleTheme,
  theme,
  isMobileMenuOpen,
  onMobileMenuToggle,
  isAdmin
}) => {


  const navItems: NavItem[] = [
    { id: 'chat', label: 'Goal Mate', icon: MessageSquare },
    { id: 'study-plan', label: 'Study Plans', icon: Calendar },
    { id: 'flashcard', label: 'Flashcards', icon: Cards },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];


  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: ShieldCheck });
  }

  const mobileMenuVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 40
      }
    }
  };

  const menuIconVariants = {
    open: { rotate: 180 },
    closed: { rotate: 0 }
  };

  const itemVariants = {
    open: {
      y: 0,
      opacity: 1,
      transition: {
        y: { stiffness: 1000, velocity: -100 }
      }
    },
    closed: {
      y: 50,
      opacity: 0,
      transition: {
        y: { stiffness: 1000 }
      }
    }
  };

  return (
    <>
      {/* Desktop & Tablet Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 md:block hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Goal Mate
              </span>
            </motion.div>

            {/* Desktop Navigation*/}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPageChange(item.id)}
                    className={`flex flex-col items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                        layoutId="desktopActiveIndicator"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Tablet Navigation*/}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPageChange(item.id)}
                    className={`flex flex-col items-center p-3 text-sm font-medium transition-all duration-200 min-w-[70px] relative ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-all duration-200" />
                    {isActive && (
                      <motion.span 
                        className="text-xs mt-1 truncate max-w-[60px] text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400"
                        layoutId="tabletActiveIndicator"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Desktop Actions - Icon Only */}
            <div className="hidden md:flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 md:hidden">
        {/* Simple Top Bar - Logo + Menu Button Only */}
        <div className="flex justify-between items-center h-16 px-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Goal Mate
            </span>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            variants={menuIconVariants}
            animate={isMobileMenuOpen ? "open" : "closed"}
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -180, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileMenuToggle}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />
            
            {/* Mobile Menu */}
            <motion.div
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 left-0 bottom-0 w-80 max-w-full bg-white dark:bg-gray-900 z-50 md:hidden shadow-xl border-r border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Goal Mate
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Your Learning Manager
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Items*/}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-2">
                    {navItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          variants={itemVariants}
                          onClick={() => {
                            onPageChange(item.id);
                            onMobileMenuToggle();
                          }}
                          className={`w-full flex items-center space-x-3 p-4 rounded-xl text-left transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          style={{ transitionDelay: `${index * 0.1}s` }}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Actions*/}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <motion.button
                    variants={itemVariants}
                    onClick={onToggleTheme}
                    className="w-full flex items-center space-x-3 p-4 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <span className="font-medium">
                      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </motion.button>
                  
                  <motion.button
                    variants={itemVariants}
                    onClick={onLogout}
                    className="w-full flex items-center space-x-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;