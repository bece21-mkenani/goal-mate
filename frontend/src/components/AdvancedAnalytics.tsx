import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, PieChart as PieIcon, AlertTriangle, CalendarDays } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ThemeContext } from '../App';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

// Data structure from our SQL functions
interface SubjectData {
  subject: string;
  total_minutes: number;
}

interface TimeData {
  day_name: string;
  total_minutes: number;
}

// Colors for the pie chart
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

// Custom label for the pie chart (shows percentage)
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null; // Don't render tiny labels
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AdvancedAnalytics: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('auth_token');

        // Fetch both data points concurrently
        const [subjectRes, timeRes] = await Promise.all([
          axios.get(`${apiUrl}/analytics/subject-breakdown`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}/analytics/time-series`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setSubjectData(subjectRes.data.data || []);
        setTimeData(timeRes.data.data || []);
      } catch (err: any) {
        console.error('Fetch Analytics Error:', err.message);
        setError('Could not load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#333' : '#fff',
    border: '1px solid #ccc',
    borderRadius: '8px',
    color: theme === 'dark' ? '#fff' : '#000',
  }; 
  
const labelStyle = {
  color: theme === 'dark' ? '#fff' : '#000',
  };

  const hasData = subjectData.length > 0 || timeData.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BarChart3 className="w-9 h-9 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your Progress Dashboard
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 px-6 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Visualize your study habits and track your progress over time.
        </p>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-64">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center min-h-64 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !error && !hasData && (
        <div className="flex flex-col justify-center items-center min-h-64 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <PieIcon className="w-12 h-12 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-4">No Data Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Use the <span className="font-semibold text-blue-500">Study Timer</span> to log your sessions!
          </p>
        </div>
      )}

      {/* Charts Grid */}
      {!isLoading && !error && hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weekly Activity Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 p-4 sm:p-6 bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-blue-500" />
              Your Study Time (Last 7 Days)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#eee'} />
                  <XAxis dataKey="day_name" stroke={theme === 'dark' ? '#999' : '#333'} />
                  <YAxis stroke={theme === 'dark' ? '#999' : '#333'} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ color: theme === 'dark' ? '#FFBB28' : '#0088FE' }} />
                  <Bar dataKey="total_minutes" name="Minutes Studied" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subject Breakdown Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-1 p-4 sm:p-6 bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <PieIcon className="w-5 h-5 mr-2 text-purple-500" />
              Subject Breakdown
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="total_minutes"
                    nameKey="subject"
                  >
                    {subjectData.map((_, index) => (
                      <Cell key={`cell-_${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle}   itemStyle={labelStyle}/>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      )}
    </motion.div>
  );
};

export default AdvancedAnalytics;