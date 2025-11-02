import axios from 'axios';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, BookOpen, Award, Loader2, CheckCircle } from 'lucide-react';
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App'; // Import theme context

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

// Define the Plan interface here, mirroring your service
interface StudyPlan {
  id: string;
  user_id: string;
  topics: string[]; // This is what we need
  schedule: any[];
  created_at: string;
}

const StudySessionTimer: React.FC = () => {
  useContext(ThemeContext);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // --- MODIFICATION: States for dynamic subjects ---
  const [subjects, setSubjects] = useState<string[]>([]); 
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true); 
  
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // --- NEW: useEffect to fetch user's subjects ---
  useEffect(() => {
    const fetchUserSubjects = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('No auth token found');

        // 1. Get User ID
        const userResponse = await axios.get(`${apiUrl}/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userId = userResponse.data.user.id;

        // 2. Get User's Study Plans
        const plansResponse = await axios.get(
          `${apiUrl}/study-plan/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // 3. Extract and de-duplicate subjects
        const allPlans: StudyPlan[] = plansResponse.data.plans || [];
        const allTopics = allPlans.flatMap(plan => plan.topics); 
        const uniqueTopics = [...new Set(allTopics)]; 
        setSubjects(uniqueTopics);
        
      } catch (err: any) {
        console.error('Failed to fetch user subjects:', err.message);
        setError('Could not load your subjects from Study Plans.');
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchUserSubjects();
  }, []); 

  // ... (Timer logic - no changes)
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  // ... (All handlers: handleStart, handlePauseResume, handleReset, handleFinishSession - no changes)
  // ... (All helpers: formatTime - no changes)
  
  const handleStart = () => {
    if (!selectedSubject) {
      setError('Please select a subject before starting.');
      return;
    }
    setError(null);
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(true);
    setTime(0);
  };

  const handleFinishSession = async () => {
    const durationInMinutes = Math.floor(time / 60);

    if (durationInMinutes < 1) {
      setError('You must study for at least 1 minute to save the session.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const userResponse = await axios.get(`${apiUrl}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = userResponse.data.user.id;

      await axios.post(
        `${apiUrl}/user/study-session`,
        { userId, subject: selectedSubject, duration: durationInMinutes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      handleReset();

    } catch (err: any) {
      console.error('Finish Session Error:', err.response?.data || err.message);
      setError('Failed to save your session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const getSeconds = `0${seconds % 60}`.slice(-2);
    const minutes = Math.floor(seconds / 60);
    const getMinutes = `0${minutes % 60}`.slice(-2);
    const getHours = `0${Math.floor(seconds / 3600)}`.slice(-2);
    return `${getHours}:${getMinutes}:${getSeconds}`;
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto p-4 sm:p-6 bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <Timer className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Study Timer
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          Focus on your studies and track your time.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 dark:text-red-400 text-center mb-4 text-sm">{error}</p>
      )}

      {/* --- MODIFICATION: Dynamic Subject Selector --- */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <BookOpen className="inline w-4 h-4 mr-2" />
          Select Subject
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          disabled={isActive || isLoadingSubjects} // Disable if timer active OR subjects loading
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
        >
          {isLoadingSubjects ? (
            <option value="" disabled>Loading your subjects...</option>
          ) : subjects.length > 0 ? (
            <>
              <option value="" disabled>Choose a subject...</option>
              {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </>
          ) : (
            <option value="" disabled>No subjects found. Add a Study Plan!</option>
          )}
        </select>
      </div>

      {/* ... (Rest of the JSX: Timer Display, Controls, Finish Button, Success Message - no changes) ... */}
      
      {/* Timer Display */}
      <div className="text-center mb-8">
        <motion.p 
          className=" text:6xl sm:text-7xl font-mono font-bold text-gray-800 dark:text-white"
          key={time}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          {formatTime(time)}
        </motion.p>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center space-x-4">
        {!isActive ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={!selectedSubject || isLoadingSubjects}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-lg font-semibold shadow-lg disabled:opacity-50"
          >
            <Play />
            <span>Start</span>
          </motion.button>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePauseResume}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold shadow-md ${
                isPaused 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                : 'bg-yellow-500 text-white'
              }`}
            >
              {isPaused ? <Play /> : <Pause />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-semibold shadow-md"
            >
              <RotateCcw />
              <span>Reset</span>
            </motion.button>
          </>
        )}
      </div>

      {/* Finish Session Button */}
      {isActive && (
        <div className="mt-8 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinishSession}
            disabled={isSaving || time < 60}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Award />
            )}
            <span>{isSaving ? 'Saving...' : 'Finish & Save Session'}</span>
          </motion.button>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="mt-4 flex items-center justify-center space-x-2 text-green-600 dark:text-green-400"
         >
           <CheckCircle className="w-5 h-5" />
           <span>Session saved successfully!</span>
         </motion.div>
      )}
    </motion.div>
  );
};

export default StudySessionTimer;