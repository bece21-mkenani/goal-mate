import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Send, AlertTriangle, LogOut } from 'lucide-react';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { ThemeContext } from '../App';
import { useSocket } from '../contexts/SocketContext';
import ConfirmationModal from './ConfirmationModal'; // Import the custom modal

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

// Interface for a message object
interface ChatMessage {
  id: bigint;
  content: string;
  created_at: string;
  user_id: string;
  users: { // This matches our Supabase query
    name: string;
    avatar_url: string | null;
  };
}

// Interface for the group's details
interface GroupDetails {
  id: string;
  name: string;
  description: string;
}

// Interface for a user who is typing
interface TypingUser {
  userId: string;
  name: string;
}

// Interface for the component's props
interface GroupChatProps {
  groupId: string;
  onBack: () => void; // Function to go back to the lobby
}

const GroupChat: React.FC<GroupChatProps> = ({ groupId, onBack }) => {
  useContext(ThemeContext);
  const { socket, isConnected } = useSocket();
  
  // Component State
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for typing indicators
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<any>(null); // To store the timeout
  
  // State for the custom "Leave Group" modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Ref for auto-scrolling to the bottom of the chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- 1. Fetch initial data (user ID, group details, message history) ---
  useEffect(() => {
    const loadChatRoom = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('No auth token');

        // Fetch all data in parallel
        const [userRes, groupRes, historyRes] = await Promise.all([
          axios.get(`${apiUrl}/auth/user`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${apiUrl}/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${apiUrl}/groups/${groupId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setCurrentUserId(userRes.data.user.id);
        setGroupDetails(groupRes.data.group);
        setMessages(historyRes.data.messages || []);
        setError(null);

      } catch (err: any) {
        console.error('Failed to load chat room:', err.message);
        setError('Could not load this group. You may not be a member.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatRoom();
  }, [groupId]);

  // --- 2. Handle Socket.io connection and events ---
  useEffect(() => {
    if (!socket || !isConnected || !groupDetails) return;

    // A. Tell the server we are joining this group's room
    console.log(`Socket emitting 'join_group': ${groupId}`);
    socket.emit('join_group', groupId);

    // B. Set up listeners
    const handleReceiveMessage = (newMessage: ChatMessage) => {
        setMessages(prevMessages => [...prevMessages, newMessage]);
    };

    const handleUserTyping = (user: TypingUser) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.userId === user.userId)) {
          return [...prev, user];
        }
        return prev;
      });
    };

    const handleUserStopTyping = (user: { userId: string }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== user.userId));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing_start', handleUserTyping);
    socket.on('user_typing_stop', handleUserStopTyping);

    // C. Clean up listeners on unmount
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing_start', handleUserTyping);
      socket.off('user_typing_stop', handleUserStopTyping);
    };
  }, [socket, isConnected, groupId, groupDetails]);

  // --- 3. Auto-scroll to bottom when new messages arrive ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]); // Also scroll if someone starts typing

  // --- 4. Handle "Leave Group" ---
  const handleLeaveGroup = () => {
    setShowLeaveModal(true); // Just open the modal
  };

  const executeLeave = async () => {
    setIsLeaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(
        `${apiUrl}/groups/${groupId}/leave`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowLeaveModal(false);
      onBack(); // Go back to the lobby
    } catch (err: any) {
      console.error('Failed to leave group:', err.message);
      setError('Failed to leave group. Please try again.');
      setShowLeaveModal(false);
    } finally {
      setIsLeaving(false);
    }
  };

  // --- 5. Handle sending a message ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    socket.emit('send_message', {
      groupId: groupId,
      content: newMessage,
    });
    
    // Stop typing when message is sent
    socket.emit('typing_stop', groupId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    setNewMessage('');
  };

  // --- 6. Handle emitting typing events ---
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!socket || !isConnected) return;

    if (!typingTimeoutRef.current) {
      // We just started typing
      socket.emit('typing_start', groupId);
    } else {
      // We are still typing, clear the old timeout
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', groupId);
      typingTimeoutRef.current = null;
    }, 2000); // 2 seconds
  };

  // --- Render States ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mt-4">Error</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">{error}</p>
        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <motion.button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </motion.button>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {groupDetails?.name || 'Chat'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {groupDetails?.description || 'Group chat'}
              </p>
            </div>
          </div>
          
          {/* Leave Group Button */}
          <motion.button
            onClick={handleLeaveGroup}
            title="Leave Group"
            className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isSender = msg.user_id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {!isSender && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 mb-1">
                    {/* Use optional chaining for safety */}
                    {msg.users?.name || 'User'} 
                  </span>
                )}
                <div
                  className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                    isSender
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </motion.div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        
        {/* Typing Indicator UI */}
        <div className="flex-shrink-0 h-6 px-4 pb-2">
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-sm text-gray-500 dark:text-gray-400 italic"
              >
                {typingUsers.map(u => u.name).join(', ')} 
                {typingUsers.length === 1 ? ' is' : ' are'} typing...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3"
        >
          <input
            type="text"
            value={newMessage}
            onChange={handleTypingChange} 
            placeholder="Type your message..."
            className="flex-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <motion.button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </motion.div>

      {/* Render the modal */}
      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={executeLeave}
        isConfirming={isLeaving}
        title={`Leave "${groupDetails?.name}"?`}
        message="Are you sure you want to leave this group? You will have to re-join to see messages again."
        confirmText="Leave Group"
      />
    </>
  );
};

export default GroupChat;