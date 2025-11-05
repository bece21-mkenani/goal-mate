import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
// Removed 'Check' from imports
import { Users, Plus, Loader2, AlertTriangle, ChevronRight, LogIn } from 'lucide-react'; 
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { ThemeContext } from '../App';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

// Interface for a single group
interface StudyGroup {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
}

interface StudyGroupsProps {
  onSelectGroup: (groupId: string) => void; 
}

const StudyGroups: React.FC<StudyGroupsProps> = ({ onSelectGroup }) => {
  useContext(ThemeContext);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for membership
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null); 

  // State for the "Create New" modal/form
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all groups AND user's groups
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');

      const [allGroupsRes, myGroupsRes] = await Promise.all([
        axios.get(`${apiUrl}/groups`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${apiUrl}/groups/me`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setGroups(allGroupsRes.data.groups || []);
      setMyGroupIds(new Set(myGroupsRes.data.groupIds || []));
      setError(null);
    } catch (err: any) {
      console.error('Fetch Groups Error:', err.message);
      setError('Could not fetch study groups.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Handle Join Group
  const handleJoinGroup = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation(); 
    setJoiningGroupId(groupId);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${apiUrl}/groups/${groupId}/join`,
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMyGroupIds(prev => new Set(prev).add(groupId));
    } catch (err: any) {
      console.error('Join Group Error:', err.message);
      setError('Failed to join group.');
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${apiUrl}/groups`,
        { name: newGroupName, description: newGroupDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreating(false);
      await fetchGroups(); // Refresh everything
    } catch (err: any) {
      console.error('Create Group Error:', err.message);
      setError('Failed to create group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
            <Users className="w-9 h-9 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Study Groups
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Join a group or create a new one to chat and study.
          </p>
        </div>
        <motion.button
          onClick={() => setIsCreating(true)}
          className="flex-shrink-0 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={20} />
          Create Group
        </motion.button>
      </div>

      {/* Loading/Error States */}
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

      {/* Group List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {groups.length === 0 && (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No groups found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Be the first to create one!
              </p>
            </div>
          )}
          
          {groups.map((group) => {
            const isMember = myGroupIds.has(group.id);
            const isJoining = joiningGroupId === group.id;

            return (
              <motion.div
                key={group.id}
                className={`p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 
                            flex flex-col sm:flex-row items-start sm:items-center justify-between
                            ${isMember ? 'cursor-pointer' : ''}`}
                whileHover={{ scale: isMember ? 1.02 : 1 }}
                onClick={() => {
                  if (isMember) onSelectGroup(group.id);
                }}
              >
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  {/* --- THIS IS THE FIX --- */}
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {group.description || 'No description'}
                  </p>
                  {/* --- END FIX --- */}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="w-full sm:w-auto">
                  {isMember ? (
                    <button 
                      onClick={() => onSelectGroup(group.id)}
                      className="flex-shrink-0 w-full sm:w-auto px-5 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg flex items-center justify-center gap-2"
                    >
                      Open Chat <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleJoinGroup(e, group.id)}
                      disabled={isJoining}
                      className="flex-shrink-0 w-full sm:w-auto px-5 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isJoining ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      Join Group
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsCreating(false)}
            />
            {/* Form */}
            <motion.div
              className="relative w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Create New Group
              </h3>
              <form onSubmit={handleCreateGroup}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Calculus Crew"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., A group for Calc 101 students"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newGroupName}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudyGroups;