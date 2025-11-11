import axios from "axios";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Group,
  Loader2,
  Send,
  UserCheck,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL!;

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalGroups: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  subscription_tier: "free" | "premium";
  user_education_level: { level: "primary" | "secondary" | "tertiary" } | null;
  created_at: string;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => (
  <motion.div
    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
      <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full">
        {icon}
      </div>
    </div>
  </motion.div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementRoom, setAnnouncementRoom] = useState("general");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("auth_token");
        const headers = { headers: { Authorization: `Bearer ${token}` } };

        const [statsRes, usersRes] = await Promise.all([
          axios.get(`${apiUrl}/admin/stats`, headers),
          axios.get(`${apiUrl}/admin/users`, headers),
        ]);

        setStats(statsRes.data);
        setUsers(usersRes.data);
      } catch (err: any) {
        console.error("Failed to fetch admin data:", err);
        setError(
          err.response?.data?.error ||
            "You do not have permission to view this page."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /*=== TIER UPDATE FUNCTION ===*/
  const handleUpdateTier = async (
    userId: string,
    newTier: "free" | "premium"
  ) => {
    const originalUsers = users;
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId ? { ...u, subscription_tier: newTier } : u
      )
    );

    try {
      const token = localStorage.getItem("auth_token");
      await axios.post(
        `${apiUrl}/admin/users/update-tier`,
        { userId, newTier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`User tier updated to ${newTier.toUpperCase()}`, {
        icon: "🚀",
      });
    } catch (err: any) {
      console.error("Failed to update tier:", err);
      setUsers(originalUsers);
      toast.error("Failed to update user tier. Please try again.");
    }
  };

  /*=== LEVEL UPDATE FUNCTION ===*/
  const handleUpdateEducationLevel = async (
    userId: string,
    newLevel: "primary" | "secondary" | "tertiary"
  ) => {
    const originalUsers = users;
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId
          ? {
              ...u,
              user_education_level: { level: newLevel },
            }
          : u
      )
    );

    try {
      const token = localStorage.getItem("auth_token");
      await axios.post(
        `${apiUrl}/admin/users/update-education-level`,
        { userId, newLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Education level set to ${newLevel.toUpperCase()}`, {
        icon: "🎓",
      });
    } catch (err: any) {
      console.error("Failed to update education level:", err);
      setUsers(originalUsers);
      toast.error("Failed to update education level. Please try again.");
    }
  };

  /*=== ANNOUNCEMENT FUNCTION ===*/
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMessage.trim()) return;

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const token = localStorage.getItem("auth_token");
      await axios.post(
        `${apiUrl}/admin/announce`,
        { roomName: announcementRoom, content: announcementMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSendSuccess(true);
      setAnnouncementMessage("");
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to send announcement:", err);
      setSendError(err.response?.data?.error || "Failed to send announcement.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Admin Dashboard
      </h1>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      )}

      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-64 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mt-4">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
            {error}
          </p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            }
          />
          <StatCard
            title="Premium Users"
            value={stats.premiumUsers}
            icon={
              <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            }
          />
          <StatCard
            title="Total Groups"
            value={stats.totalGroups}
            icon={
              <Group className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            }
          />
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            User Management
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Joined On
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Subscription
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Education Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {users.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={user.subscription_tier}
                            onChange={(e) =>
                              handleUpdateTier(
                                user.id,
                                e.target.value as "free" | "premium"
                              )
                            }
                            className={`p-2 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              user.subscription_tier === "premium"
                                ? "text-green-700 dark:text-green-300"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                          </select>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={user.user_education_level?.level || ""}
                            onChange={(e) =>
                              handleUpdateEducationLevel(
                                user.id,
                                e.target.value as
                                  | "primary"
                                  | "secondary"
                                  | "tertiary"
                              )
                            }
                            className={`p-2 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              user.user_education_level?.level === "tertiary"
                                ? "text-purple-700 dark:text-purple-300"
                                : user.user_education_level?.level ===
                                  "secondary"
                                ? "text-orange-700 dark:text-orange-300"
                                : user.user_education_level?.level === "primary"
                                ? "text-green-700 dark:text-green-300"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="tertiary">Tertiary</option>
                          </select>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Announcement
          </h2>
          <form
            onSubmit={handleSendAnnouncement}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  htmlFor="room-select"
                >
                  Room
                </label>
                <select
                  id="room-select"
                  value={announcementRoom}
                  onChange={(e) => setAnnouncementRoom(e.target.value)}
                  className="w-full text-orange-500  p-2 rounded-md border  bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general" className="text-orange-500">
                    general
                  </option>
                  <option value="primary" className="text-green-500">
                    primary
                  </option>
                  <option value="secondary" className="text-blue-500">
                    secondary
                  </option>
                  <option value="tertiary" className="text-purple-500">
                    tertiary
                  </option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label
                  className="block text-orange-500 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  htmlFor="message-content"
                >
                  Message
                </label>
                <textarea
                  id="message-content"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  rows={4}
                  className="w-full p-2 text-orange-500 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 mt-4">
              {sendSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-green-600 dark:text-green-400"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Sent!</span>
                </motion.div>
              )}
              {sendError && (
                <span className="text-sm text-red-500">{sendError}</span>
              )}
              <motion.button
                type="submit"
                disabled={isSending || !announcementMessage.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 flex items-center gap-2"
                whileHover={{ opacity: !isSending ? 1.05 : 1 }}
                whileTap={{ opacity: !isSending ? 0.95 : 1 }}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Announce
              </motion.button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
