
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../App';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

// Define interfaces locally 
interface UserStatistics {
  id: string;
  user_id: string;
  total_points: number;
  day_streak: number;
  last_active_date: string;
  total_study_time: number;
  subjects_studied: string[];
  achievements_earned: string[];
  created_at: string;
  updated_at: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  condition_type: string;
  condition_value: number;
}

interface UserProfileProps {
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  useContext(ThemeContext);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No authentication token found');

      // Fetch user info
      const userResponse = await axios.get(`${apiUrl}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(userResponse.data.user);

      // Fetch user statistics
      const statsResponse = await axios.get(
        `${apiUrl}/user/statistics/${userResponse.data.user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserStats(statsResponse.data.statistics);

      // Fetch achievements
      const achievementsResponse = await axios.get(
        `${apiUrl}/user/achievements`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAchievements(achievementsResponse.data.achievements || []);

    } catch (err: any) {
      console.error('Fetch User Data Error:', err.message);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const getEarnedAchievements = (): Achievement[] => {
    if (!userStats) return [];
    return achievements.filter(achievement => 
      userStats.achievements_earned.includes(achievement.id)
    );
  };

  const getAvailableAchievements = (): Achievement[] => {
    if (!userStats) return [];
    return achievements.filter(achievement => 
      !userStats.achievements_earned.includes(achievement.id)
    );
  };

  const calculateProgress = (achievement: Achievement): number => {
    if (!userStats) return 0;
    
    switch (achievement.condition_type) {
      case 'streak':
        return Math.min((userStats.day_streak / achievement.condition_value) * 100, 100);
      case 'points':
        return Math.min((userStats.total_points / achievement.condition_value) * 100, 100);
      case 'sessions':
        return 0;
      case 'subjects':
        return Math.min((userStats.subjects_studied.length / achievement.condition_value) * 100, 100);
      default:
        return 0;
    }
  };

  const studyTips = [
    "Study in 25-minute blocks with 5-minute breaks (Pomodoro Technique)",
    "Review your notes within 24 hours to improve retention",
    "Teach what you've learned to someone else",
    "Create mind maps to visualize complex topics",
    "Practice active recall instead of passive reading",
    "Get enough sleep - it's crucial for memory consolidation"
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your Study Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track your progress and achievements
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="mt-4 sm:mt-0 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </motion.button>
      </div>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {userInfo?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {userInfo?.name || 'User'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{userInfo?.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Member since {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString() : 'recently'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Statistics Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Statistics</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Points */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Points</p>
                  <p className="text-2xl font-bold">{userStats?.total_points || 0}</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-200" />
              </div>
            </motion.div>

            {/* Day Streak */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Day Streak</p>
                  <p className="text-2xl font-bold">{userStats?.day_streak || 0} days</p>
                </div>
                <Zap className="w-8 h-8 text-orange-200" />
              </div>
            </motion.div>

            {/* Study Time */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-green-500 to-teal-500 text-white rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Study Time</p>
                  <p className="text-2xl font-bold">{Math.round((userStats?.total_study_time || 0) / 60)} hours</p>
                </div>
                <Clock className="w-8 h-8 text-green-200" />
              </div>
            </motion.div>

            {/* Subjects Studied */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Subjects Studied</p>
                  <p className="text-2xl font-bold">{userStats?.subjects_studied?.length || 0}</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-200" />
              </div>
            </motion.div>
          </div>

          {/* Recent Subjects */}
          {userStats?.subjects_studied && userStats.subjects_studied.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Your Subjects
              </h4>
              <div className="flex flex-wrap gap-2">
                {userStats.subjects_studied.map((subject: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Study Tips */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Study Tips
          </h3>
          <div className="space-y-3">
            {studyTips.map((tip: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-500" />
          Achievements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getEarnedAchievements().map((achievement: Achievement) => (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <h4 className="font-semibold">{achievement.name}</h4>
                  <p className="text-yellow-100 text-sm">{achievement.description}</p>
                  <p className="text-yellow-200 text-xs mt-1">+{achievement.points} points</p>
                </div>
              </div>
            </motion.div>
          ))}

          {getAvailableAchievements().map((achievement: Achievement) => (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl text-gray-400">{achievement.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-600 dark:text-gray-300">{achievement.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{achievement.description}</p>
                  <div className="mt-2 bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgress(achievement)}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    +{achievement.points} points
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfile;