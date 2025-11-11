import axios from "axios";
import { motion, type Variants } from "framer-motion";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  History,
  Loader2,
  Plus,
  Trash2,
  CalendarDays,
} from "lucide-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ThemeContext } from "../App";

const apiUrl = import.meta.env.VITE_API_URL!;

const getLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split("T")[0];
};

interface StudyPlan {
  id: string;
  user_id: string;
  topics: string[];
  schedule: Array<{
    day: number;
    time: string;
    subject: string;
    tasks: string[];
  }>;
  created_at: string;
}

interface PlanHistory {
  id: string;
  user_id: string;
  subjects: string[];
  time_slots: number[];
  schedule_count: number;
  created_at: string;
}

const StudyPlan: React.FC = () => {
  useContext(ThemeContext);
  const [subjects, setSubjects] = useState<string[]>([
    "GDP",
    "Calculus",
    "Statistics",
  ]);
  const [timeSlots, setTimeSlots] = useState<
    Array<{ day: number; hours: number }>
  >([
    { day: 1, hours: 2 },
    { day: 2, hours: 3 },
    { day: 3, hours: 2 },
    { day: 4, hours: 3 },
    { day: 5, hours: 2 },
  ]);

  const [startDate, setStartDate] = useState(getLocalDateString(new Date()));

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [planHistory, setPlanHistory] = useState<PlanHistory[]>([]);
  const [selectedHistoryPlan, setSelectedHistoryPlan] =
    useState<StudyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);

  const fetchPlanHistory = useCallback(async () => {
    if (hasFetchedHistory) return;

    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem("auth_token");
      const userResponse = await axios.get(`${apiUrl}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = userResponse.data.user.id;

      const response = await axios.get(
        `${apiUrl}/study-plan/history/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlanHistory(response.data.plans || []);
      setHasFetchedHistory(true);
    } catch (err: any) {
      console.error(
        "Fetch Plan History Error:",
        err.response?.data || err.message
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, [hasFetchedHistory]);

  useEffect(() => {
    fetchPlanHistory();
  }, [fetchPlanHistory]);

  const fetchPlanDetails = async (planId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get(`${apiUrl}/study-plan/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedHistoryPlan(response.data.plan);
      setPlan(null);
    } catch (err: any) {
      console.error(
        "Fetch Plan Details Error:",
        err.response?.data || err.message
      );
      setError("Failed to load plan details");
    }
  };

  const handleGeneratePlan = async () => {
    if (!subjects.length || !timeSlots.length || !startDate) {
      setError("Please add subjects, time slots, and a valid start date");
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem("auth_token");
      const userResponse = await axios.get(`${apiUrl}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = userResponse.data.user.id;

      const response = await axios.post(
        `${apiUrl}/study-plan/generate`,
        {
          userId,
          subjects,
          timeSlots: timeSlots.map((slot) => slot.hours),
          startDate: startDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Study Plan Response:", response.data);
      setPlan(response.data.plan);
      setSelectedHistoryPlan(null);
      setError(null);
      setHasFetchedHistory(false);
      await fetchPlanHistory();
    } catch (err: any) {
      console.error("Generate Plan Error:", err.response?.data || err.message);
      setError("Failed to generate study plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, ""]);
  };

  const handleUpdateSubject = (index: number, value: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = value;
    setSubjects(updatedSubjects);
  };

  const handleRemoveSubject = (index: number) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };

  const handleAddTimeSlot = () => {
    const nextDay = timeSlots.length + 1;
    setTimeSlots([...timeSlots, { day: nextDay, hours: 2 }]);
  };

  const handleUpdateTimeSlot = (index: number, hours: number) => {
    const updatedTimeSlots = [...timeSlots];
    updatedTimeSlots[index].hours = hours;
    setTimeSlots(updatedTimeSlots);
  };

  const handleRemoveTimeSlot = (index: number) => {
    const updatedTimeSlots = timeSlots.filter((_, i) => i !== index);
    const renumberedSlots = updatedTimeSlots.map((slot, idx) => ({
      ...slot,
      day: idx + 1,
    }));
    setTimeSlots(renumberedSlots);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const planVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const dayVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  const displayPlan = selectedHistoryPlan || plan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Calendar className="w-9 h-9 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Study Plan Generator
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 px-6 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Create your personalized study schedule. Add subjects and time slots
          to generate an optimal learning plan.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-center"
        >
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subjects Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Study Subjects
            </h3>
          </div>

          <div className="space-y-3 mb-4">
            {subjects.map((subject, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => handleUpdateSubject(index, e.target.value)}
                    className="w-full bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-0 text-sm sm:text-base"
                    placeholder="Enter subject name..."
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveSubject(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove subject"
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddSubject}
            className="w-full py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Plus size={18} />
            <span>Add Subject</span>
          </motion.button>
        </motion.div>

        {/* Time Slots Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Study Schedule
            </h3>
          </div>

          {/* Start Date Input */}
          <div className="mb-6">
            <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
              <CalendarDays className="w-4 h-4 mr-2" />
              Plan Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={getLocalDateString(new Date())}
              className=" w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-3 mb-4">
            {timeSlots.map((slot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">
                    Day {slot.day}
                  </span>
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="number"
                      value={slot.hours}
                      onChange={(e) =>
                        handleUpdateTimeSlot(
                          index,
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="1"
                      max="12"
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Hours"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      hours
                    </span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveTimeSlot(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove time slot"
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddTimeSlot}
            className="w-full py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <Plus size={18} />
            <span>Add Day</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center mb-8">
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={handleGeneratePlan}
          disabled={isGenerating || !subjects.length || !timeSlots.length}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-lg font-semibold flex items-center justify-center space-x-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>Generating Plan...</span>
            </>
          ) : (
            <>
              <Calendar size={24} />
              <span>Generate Study Plan</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Plans History Section */}
      {(planHistory.length > 0 || isLoadingHistory) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-2 mb-4">
            <History className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Plans History
            </h3>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {planHistory.map((historyPlan) => (
                <motion.div
                  key={historyPlan.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fetchPlanDetails(historyPlan.id)}
                  className={`p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedHistoryPlan?.id === historyPlan.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {historyPlan.schedule_count}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {historyPlan.schedule_count} Day
                        {historyPlan.schedule_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {historyPlan.subjects?.slice(0, 2).join(", ") ||
                        "No subjects"}
                      {historyPlan.subjects?.length > 2 &&
                        ` +${historyPlan.subjects.length - 2} more`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(historyPlan.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Generated Plan or Selected History Plan */}
      {displayPlan && (
        <motion.div
          variants={planVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {selectedHistoryPlan
                ? "Selected Study Plan"
                : "Your Personalized Study Plan"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {selectedHistoryPlan
                ? "Previously generated plan"
                : "Optimized schedule for effective learning"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPlan.schedule.map((day, index) => (
              <motion.div
                key={index}
                variants={dayVariants}
                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 border border-blue-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {day.day}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Day {day.day}
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock size={14} className="text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {day.time}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <BookOpen size={14} className="text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {day.subject}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      TASKS:
                    </p>
                    <ul className="space-y-1">
                      {day.tasks.map((task, taskIndex) => (
                        <li
                          key={taskIndex}
                          className="text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StudyPlan;
