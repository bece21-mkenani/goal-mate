// ==========================
// File: GroupChat.tsx
// ==========================

import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowLeft, Loader2, LogOut, Send,
  MessageSquare, Paperclip, Smile, CheckCheck,
  Menu, Lock 
} from 'lucide-react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ThemeContext } from '../App';
import { useSocket } from '../contexts/SocketContext';
import ConfirmationModal from './ConfirmationModal';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

// --- Interfaces ---
interface ChatMessage {
  id: bigint;
  content: string;
  created_at: string;
  user_id: string;
  room_name: string;
  file_url: string | null;
  reactions: { [key: string]: string[] } | null;
  users: {
    name: string;
    avatar_url: string | null;
  };
}
interface GroupDetails {
  id: string;
  name: string;
  description: string;
  is_admin_group: boolean;
}
interface GroupRoom {
  id: string;
  group_id: string;
  room_name: string;
  education_level: 'primary' | 'secondary' | 'tertiary' | null;
}
interface TypingUser {
  userId: string;
  name: string;
}
interface OnlineUser {
  id: string;
  name: string;
  avatar_url: string | null;
}
interface GroupChatProps {
  groupId: string;
  roomName: string;
  onBack: () => void;
}
interface CurrentUser {
  id: string | null;
  is_admin: boolean;
  education_level: string | null;
}

// --- EmojiPicker component ---
const EmojiPicker: React.FC<{ onEmojiSelect: (emoji: string) => void }> = ({ onEmojiSelect }) => {
  const emojis = [
    '👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '😍', '😊',
    '🎉', '🤔', '🌟', '📚', '📖', '🎓', '✏️', '🙌', '👎', '🥳', '🤗', '😇', '🥺'
  ];
  return (
    <div className="absolute bottom-16 -left-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 z-20 max-w-md transition-all">
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-9 lg:grid-cols-10 gap-1 justify-items-center">
        {emojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="text-lg sm:text-xl md:text-2xl hover:scale-125 active:scale-95 transition-transform duration-200 ease-out p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Sidebar Sub-Component ---
const AdminSidebarContent: React.FC<{
  groupDetails: GroupDetails | null;
  roomList: GroupRoom[];
  currentRoom: string;
  onlineUsers: OnlineUser[];
  currentUser: CurrentUser;
  onSwitchRoom: (room: GroupRoom) => void;
}> = ({ groupDetails, roomList, currentRoom, onlineUsers, currentUser, onSwitchRoom }) => {
  return (
    <div className="w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
          {groupDetails?.name}
        </h2>
      </div>

      {/* Room List (NOW WITH SECURITY) */}
      <div className="p-4 space-y-2 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Rooms
        </h3>
        {roomList.map((room) => {
          const isEducationRoom = ['primary', 'secondary', 'tertiary'].includes(room.room_name);
          
          // --- FIX: Correctly use isEducationRoom variable ---
          const isAllowed = 
            currentUser.is_admin || // Admins can join any room
            !isEducationRoom || // Everyone can join non-education rooms (like 'general')
            room.room_name === currentUser.education_level; // User can join their matching level

          return (
            <button
              key={room.id}
              onClick={() => isAllowed ? onSwitchRoom(room) : null}
              disabled={!isAllowed}
              title={!isAllowed ? "You don't have permission for this room" : `Join ${room.room_name} room`}
              className={`
                w-full text-left p-3 rounded-lg flex items-center justify-between gap-3 transition-colors
                ${currentRoom === room.room_name
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                ${!isAllowed ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium capitalize">{room.room_name}</span>
              </div>
              {!isAllowed && (
                <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Online Users */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Online ({onlineUsers.length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {onlineUsers.length === 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 p-2">
              Just you in here.
            </span>
          )}
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {user.name}
                {user.id === currentUser.id && ' (You)'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- Main GroupChat Component ---
const GroupChat: React.FC<GroupChatProps> = ({ groupId, roomName, onBack }) => {
  useContext(ThemeContext);
  const { socket, isConnected } = useSocket();

  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // --- FIX: Removed the old 'currentUserId' state ---
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: null,
    is_admin: false,
    education_level: null
  });
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<any>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isAdminGroup, setIsAdminGroup] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(roomName);
  const [roomList, setRoomList] = useState<GroupRoom[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [readReceipts, setReadReceipts] = useState<Record<string, Set<string>>>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- Load Chat Room ---
  useEffect(() => {
    const loadChatRoom = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('No auth token');
        const headers = { Authorization: `Bearer ${token}` };

        const [userRes, groupRes] = await Promise.all([
          axios.get(`${apiUrl}/auth/user`, { headers }),
          axios.get(`${apiUrl}/groups/${groupId}`, { headers })
        ]);

        const user = userRes.data.user;
        const group = groupRes.data.group;
        
        setCurrentUser({
          id: user.id,
          is_admin: user.is_admin,
          education_level: user.education_level
        });

        setGroupDetails(group);
        setIsAdminGroup(group.is_admin_group);

        const initialRoom = roomName;
        setCurrentRoom(initialRoom);

        if (group.is_admin_group) {
          const roomsRes = await axios.get(`${apiUrl}/groups/${groupId}/rooms`, { headers });
          setRoomList(roomsRes.data.rooms || []);
        }

        const historyRes = await axios.get(`${apiUrl}/groups/${groupId}/messages`, {
          headers,
          params: { roomName: initialRoom }
        });

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
  }, [groupId, roomName]);

  // --- Socket.io listeners ---
  useEffect(() => {
    if (!socket || !isConnected || !groupDetails) return;

    console.log(`Socket emitting 'join_room': ${groupId}-${currentRoom}`);
    socket.emit('join_room', { groupId, roomName: currentRoom });

    const handleReceiveMessage = (incoming: ChatMessage) => {
      if (incoming.room_name === currentRoom) {
        setMessages(prevMessages => [...prevMessages, incoming]);
      }
    };
    const handleUserTyping = (user: TypingUser) => {
      setTypingUsers(prev => (prev.find(u => u.userId === user.userId) ? prev : [...prev, user]));
    };
    const handleUserStopTyping = (user: { userId: string }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== user.userId));
    };
    const handleReactionUpdate = (updatedMessage: { id: bigint; reactions: any }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === updatedMessage.id ? { ...msg, reactions: updatedMessage.reactions } : msg
      ));
    };
    const handleReadReceipt = (receipt: { messageId: bigint; userId: string }) => {
      setReadReceipts(prev => {
        const newReceipts = { ...prev };
        const key = receipt.messageId.toString();
        if (!newReceipts[key]) newReceipts[key] = new Set();
        newReceipts[key].add(receipt.userId);
        return newReceipts;
      });
    };
    const handleOnlineUsers = (users: OnlineUser[]) => {
      setOnlineUsers(users);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing_start', handleUserTyping);
    socket.on('user_typing_stop', handleUserStopTyping);
    socket.on('reaction_update', handleReactionUpdate);
    socket.on('read_receipt_update', handleReadReceipt);
    socket.on('online_users_update', handleOnlineUsers);

    return () => {
      console.log(`Socket emitting 'leave_room': ${groupId}-${currentRoom}`);
      socket.emit('leave_room', { groupId, roomName: currentRoom });
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing_start', handleUserTyping);
      socket.off('user_typing_stop', handleUserStopTyping);
      socket.off('reaction_update', handleReactionUpdate);
      socket.off('read_receipt_update', handleReadReceipt);
      socket.off('online_users_update', handleOnlineUsers);
    };
  }, [socket, isConnected, groupId, currentRoom, groupDetails]);

  // --- Auto-scroll ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // --- Handle Leave Group ---
  const handleLeaveGroup = () => setShowLeaveModal(true);
  const executeLeave = async () => {
    setIsLeaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${apiUrl}/groups/${groupId}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowLeaveModal(false);
      onBack();
    } catch (err: any) {
      console.error('Failed to leave group:', err.message);
      setError(err.response?.data?.error || 'Failed to leave group. Please try again.');
      setShowLeaveModal(false);
    } finally {
      setIsLeaving(false);
    }
  };

  // --- Handle Send Message ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;
    socket.emit('send_message', {
      groupId,
      roomName: currentRoom,
      content: newMessage,
      fileUrl: null
    });
    socket.emit('typing_stop', { groupId, roomName: currentRoom });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setNewMessage('');
    setShowEmojiPicker(false);
  };

  // --- Handle Typing ---
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socket || !isConnected) return;
    if (!typingTimeoutRef.current) {
      socket.emit('typing_start', { groupId, roomName: currentRoom });
    } else {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { groupId, roomName: currentRoom });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // --- switchRoom ---
  const switchRoom = async (room: GroupRoom) => {
    if (room.room_name === currentRoom) return;
    setIsMobileSidebarOpen(false);
    setIsLoading(true);
    setMessages([]);
    setTypingUsers([]);
    setOnlineUsers([]);
    setCurrentRoom(room.room_name);
    try {
      const token = localStorage.getItem('auth_token');
      const historyRes = await axios.get(`${apiUrl}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { roomName: room.room_name }
      });
      setMessages(historyRes.data.messages || []);
      setError(null);
    } catch (err) {
      setError('Failed to load messages for this room.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Add Reaction ---
  const handleAddReaction = (messageId: bigint, emoji: string) => {
    if (!socket || !isConnected) return;
    socket.emit('add_reaction', {
      messageId,
      emoji,
      groupId,
      roomName: currentRoom
    });
  };

  // --- File Upload ---
  const handleFileUploadClick = () => {
    console.log('File upload not implemented yet.');
  };

  // --- Emoji Select ---
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // --- Loading/Error renders ---
  if (isLoading && !groupDetails) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }
  if (error && !groupDetails) {
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

  // ============================================================
  // ===               RENDER: USER-CREATED GROUP             ===
  // ============================================================
  if (!isAdminGroup) {
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
                whileHover={{ opacity: 0.8 }}
                whileTap={{ opacity: 0.8 }}
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </motion.button>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {groupDetails?.name || 'Chat'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  {groupDetails?.description || 'Group chat'}
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleLeaveGroup}
              title="Leave Group"
              className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
              whileHover={{ opacity: 0.8 }}
              whileTap={{ opacity: 0.8 }}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {error && (
              <div className="flex flex-col items-center justify-center p-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">{error}</p>
              </div>
            )}
            {messages.map((msg) => {
              const isSender = msg.user_id === currentUser.id;
              return (
                <motion.div
                  key={msg.id.toString()}
                  className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {!isSender && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 mb-1">
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
              whileHover={{ opacity: 0.8 }}
              whileTap={{ opacity: 0.8 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </form>
        </motion.div>

        <ConfirmationModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onConfirm={executeLeave}
          isConfirming={isLeaving}
          title={`Leave "${groupDetails?.name}"?`}
          message="Are you sure you want to leave this group? You will have to re-join to see messages again."
          confirmText="Exit"
        />
      </>
    );
  }

  // ============================================================
  // ===               RENDER: ADMIN GROUP                   ===
  // ============================================================
  return (
    <>
      {/* --- Mobile Sidebar (Slide-in) --- */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 z-40"
            >
              <AdminSidebarContent 
                groupDetails={groupDetails}
                roomList={roomList}
                currentRoom={currentRoom}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                onSwitchRoom={switchRoom}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Main Admin Chat Layout --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-6xl mx-auto h-[90vh] flex flex-row bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {/* --- Desktop Sidebar --- */}
        <div className="hidden lg:flex rounded-l-xl overflow-hidden border-r border-gray-200 dark:border-gray-700">
          <AdminSidebarContent 
            groupDetails={groupDetails}
            roomList={roomList}
            currentRoom={currentRoom}
            onlineUsers={onlineUsers}
            currentUser={currentUser}
            onSwitchRoom={switchRoom}
          />
        </div>

        {/* === Main Chat Area === */}
        <div className="flex-1 flex flex-col">
          {/* Header (with menu button) */}
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

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden ml-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </motion.button>

              <div className="ml-4">
              {currentRoom === 'general' ? (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {currentRoom} Group
                </h2>
              ) : (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {currentRoom} Group
                </h2>
              )}
                <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  {groupDetails?.description}
                </p>
              </div>
            </div>

            <motion.button
              disabled={true}
              title="You cannot leave the admin group"
              className="p-2 rounded-full text-gray-400 dark:text-gray-600 cursor-not-allowed"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {isLoading && (
              <div className="flex justify-center items-center h-full">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center p-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">{error}</p>
              </div>
            )}
            {messages.map((msg) => {
              const isSender = msg.user_id === currentUser.id;
              return (
                <motion.div
                  key={msg.id.toString()}
                  className={`flex flex-col group ${isSender ? 'items-end' : 'items-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {!isSender && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 mb-1">
                      {msg.users?.name || 'User'}
                    </span>
                  )}
                  <div
                    className={`max-w-xs md:max-w-lg p-3 rounded-2xl relative ${
                      isSender
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>

                    {/* Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(msg.reactions).map(([emoji, userIds]) =>
                          userIds.length > 0 && (
                            <span
                              key={emoji}
                              className="text-xs bg-black bg-opacity-10 dark:bg-white dark:bg-opacity-20 px-2 py-1 rounded-full cursor-pointer"
                              onClick={() => handleAddReaction(msg.id, emoji)}
                            >
                              {emoji} {userIds.length}
                            </span>
                          )
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleAddReaction(msg.id, '👍')}
                      className="absolute -bottom-3 -right-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-full p-1 shadow-md transition-all"
                    >
                      <Smile className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isSender && (
                      <CheckCheck className={`w-4 h-4 ${
                        readReceipts[msg.id.toString()] && readReceipts[msg.id.toString()].size > 0
                          ? 'text-blue-500' // Read
                          : 'text-gray-400' // Sent
                      }`} />
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Typing Indicator */}
          <div className="flex-shrink-0 h-6 px-4 pb-2">
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
            className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleFileUploadClick}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={handleTypingChange}
                placeholder={` Send message in ${currentRoom} group`}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && <EmojiPicker onEmojiSelect={handleEmojiSelect} />}
            </div>
            <motion.button
              type="submit"
              disabled={!isConnected || !newMessage.trim()}
              className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg disabled:opacity-50"
              whileHover={{ opacity: 1.1 }}
              whileTap={{ opacity: 0.9 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </form>
        </div>
      </motion.div>

      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={isAdminGroup ? () => setShowLeaveModal(false) : executeLeave}
        isConfirming={isLeaving}
        title={`Leave "${groupDetails?.name}"?`}
        message={isAdminGroup ? "You cannot leave the admin group." : "Are you sure you want to leave this group? You will have to re-join to see messages again."}
        confirmText={isAdminGroup ? "OK" : "Exit"}
      />
    </>
  );
};

export default GroupChat;