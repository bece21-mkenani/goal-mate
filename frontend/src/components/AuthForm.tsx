import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, Moon, Sun } from 'lucide-react';
import React, { useContext, useState } from 'react';
import { ThemeContext } from '../App';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [isSignInLoading, setIsSignInLoading] = useState(false);

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password');
      return;
    }
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setIsSignUpLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/auth/signup`, { email, password, name });
      console.log('Signup Full Response:', res.data);
      setMessage(`Signed up: ${res.data.user?.email || 'No user returned'}`);
      localStorage.setItem('auth_token', res.data.session);
      onAuthSuccess();
    } catch (err: any) {
      console.error('SignUp Error:', err.response?.data || err.message);
      setMessage(`Error signing up: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSignUpLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password');
      return;
    }
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address');
      return;
    }

    setIsSignInLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/auth/signin`, { email, password });
      const { user, session } = res.data;
      if (user && session) {
        localStorage.setItem('auth_token', session);
        setMessage(`Signed in: ${user.email}`);
        onAuthSuccess();
      } else {
        setMessage('Sign in successful but no session returned');
      }
    } catch (err: any) {
      console.error('SignIn Error:', err.response?.data || err.message);
      setMessage(`Error signing in: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSignInLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md sm:max-w-lg mx-auto p-4 sm:p-6 bg-gray-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md"
    >
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center"
      >
        Goal Mate
      </motion.h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name
          </label>
          <motion.input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
            placeholder="Enter your name"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <motion.input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
            placeholder="Enter your email"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <motion.input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
            placeholder="Enter your password"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div className="flex flex-row justify-between items-center">
          <button
            onClick={handleSignUp}
            disabled={isSignUpLoading || isSignInLoading}
            className="flex-1 mr-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white dark:text-white py-2 px-4 rounded-md text-sm sm:text-base disabled:opacity-50 flex items-center justify-center"
          >
            {isSignUpLoading ? (
              <Loader2 size={20} className="animate-spin mr-2" />
            ) : (
              'Sign Up'
            )}
          </button>
          <button
            onClick={handleSignIn}
            disabled={isSignUpLoading || isSignInLoading}
            className="flex-1 ml-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white dark:text-white py-2 px-4 rounded-md text-sm sm:text-base disabled:opacity-50 flex items-center justify-center"
          >
            {isSignInLoading ? (
              <Loader2 size={20} className="animate-spin mr-2" />
            ) : (
              'Sign In'
            )}
          </button>
        </div>
        <motion.div
          className="flex justify-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm sm:text-base"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </motion.button>
        </motion.div>
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`mt-4 text-center text-sm sm:text-base ${
              message.includes('Error') ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'
            }`}
          >
            {message}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default AuthForm;