import React, { useState, useEffect, useContext, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { motion, type Variants } from 'framer-motion';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { ThemeContext } from '../App';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';
const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.8ga6eiQymTcO3OZLGDe3WuAHkWcxgRA9ywG3xJ6QzNI';

const Chat: React.FC = () => {
  useContext(ThemeContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  interface Message {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    sender: 'user' | 'ai';
  }

  interface MessagePayload {
    content: string;
    created_at: string;
    sender: 'user' | 'ai';
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiThinking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please sign in to use the chat');
        return;
      }
      try {
        const res = await axios.get(`${apiUrl}/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetch User Response:', res.data);
        setUserId(res.data.user.id);
      } catch (err: any) {
        console.error('Fetch User Error:', err.response?.data || err.message);
        setError('Failed to fetch user. Please sign in again.');
      }
    };
    fetchUser();
  }, []);

  const fetchMessages = async () => {
    if (!userId) return;

    const token = localStorage.getItem('auth_token');
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    try {
      const { data, error } = await supabaseAuth
        .from('chat_sessions')
        .select('id, user_id, messages, created_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Fetch Messages Error Details:', error);
        throw new Error(`Failed to load messages: ${error.message}`);
      }

      console.log('Fetch Messages Data:', data);

      if (!data || data.length === 0) {
        setMessages([]);
        return;
      }

      const formattedMessages: Message[] = data.flatMap((session) =>
        (session.messages as MessagePayload[]).map((msg, index) => ({
          id: `${session.id}-${index}`,
          user_id: session.user_id,
          content: msg.content,
          created_at: msg.created_at,
          sender: msg.sender,
        }))
      );
      formattedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(formattedMessages);
    } catch (err: any) {
      console.error('Fetch Messages Catch Error:', err.message);
      setError('Failed to load messages');
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchMessages();

    const token = localStorage.getItem('auth_token');
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const subscription = supabaseAuth
      .channel(`chat_sessions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime INSERT:', {
            eventType: payload.eventType,
            new: payload.new,
            errors: payload.errors,
          });
          const newMessages = (payload.new.messages as MessagePayload[]).map((msg, index) => ({
            id: `${payload.new.id}-${index}`,
            user_id: payload.new.user_id,
            content: msg.content,
            created_at: msg.created_at,
            sender: msg.sender,
          }));
          setMessages((prev) => {
            const existingIds = new Set(prev.map((msg) => msg.id));
            const filteredNewMessages = newMessages.filter((msg) => !existingIds.has(msg.id));
            const updated = [...prev, ...filteredNewMessages];
            return updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime UPDATE:', {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            errors: payload.errors,
          });
          const updatedMessages = (payload.new.messages as MessagePayload[]).map((msg, index) => ({
            id: `${payload.new.id}-${index}`,
            user_id: payload.new.user_id,
            content: msg.content,
            created_at: msg.created_at,
            sender: msg.sender,
          }));
          setMessages((prev) => {
            const existingIds = new Set(prev.map((msg) => msg.id));
            const filteredNewMessages = updatedMessages.filter((msg) => !existingIds.has(msg.id));
            const updated = [...prev, ...filteredNewMessages];
            return updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription Status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to chat_sessions for user:', userId);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('Subscription failed or closed:', status);
        }
      });

    return () => {
      supabaseAuth.removeChannel(subscription);
    };
  }, [userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    setIsSending(true);
    setIsAiThinking(true);
    const userMessage = newMessage;
    setNewMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      console.log('Sending to AI:', { userId, message: userMessage });
      
      // Add user message immediately to the chat
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        user_id: userId,
        content: userMessage,
        created_at: new Date().toISOString(),
        sender: 'user'
      };
      
      setMessages(prev => [...prev, tempUserMessage]);

      const aiResponse = await axios.post(
        `${apiUrl}/ai/generate`,
        { userId, message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('AI Response:', aiResponse.data);
      
      // Add a temporary AI thinking message
      const thinkingMessage: Message = {
        id: `thinking-${Date.now()}`,
        user_id: userId,
        content: 'Thinking...',
        created_at: new Date().toISOString(),
        sender: 'ai'
      };
      
      setMessages(prev => [...prev, thinkingMessage]);
      
      // Simulate streaming response
      const responseText = aiResponse.data.response || aiResponse.data;
      let displayedText = '';
      
      // Remove the thinking message and add streaming response
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
      
      for (let i = 0; i < responseText.length; i++) {
        displayedText += responseText[i];
        const streamingMessage: Message = {
          id: `streaming-${Date.now()}`,
          user_id: userId,
          content: displayedText,
          created_at: new Date().toISOString(),
          sender: 'ai'
        };
        
        // Update the streaming message
        setMessages(prev => {
          const withoutStreaming = prev.filter(msg => !msg.id.startsWith('streaming-'));
          return [...withoutStreaming, streamingMessage].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        
        // Add a small delay for streaming effect
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Final fetch to get the actual stored messages
      await fetchMessages();
      
    } catch (err: any) {
      console.error('Send Message Error:', err.response?.data || err.message);
      setError('Failed to send message');
      
      // Remove any temporary messages on error
      setMessages(prev => prev.filter(msg => 
        !msg.id.startsWith('temp-') && 
        !msg.id.startsWith('thinking-') && 
        !msg.id.startsWith('streaming-')
      ));
    } finally {
      setIsSending(false);
      setIsAiThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const messageVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.3, 
        ease: 'easeOut' 
      } 
    },
  };

  const thinkingVariants: Variants = {
    initial: { opacity: 0.5 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: 'reverse' as const
      }
    }
  };

  // Calculate dynamic width based on message content
  const getMessageWidth = (content: string) => {
    const length = content.length;
    if (length < 5) return 'max-w-[80px]';
    if (length < 10) return 'max-w-[100px]';
    if (length < 20) return 'max-w-[200px]';
    if (length < 50) return 'max-w-[300px]';
    if (length < 100) return 'max-w-[400px]';
    if (length < 200) return 'max-w-[500px]';
    return 'max-w-[600px]';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto h-screen flex flex-col bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Study Buddy
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your AI learning companion
            </p>
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-center text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Messages Container - Now much taller */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        {messages.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to Goal Mate!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md">
              I'm here to help you learn. Ask me anything about your subjects, 
              request explanations, or get study tips. Let's start learning together!
            </p>
          </motion.div>
        )}
        
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.05 }}
            className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex items-start space-x-3 max-w-[85%] ${msg.sender === 'ai' ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.sender === 'ai' 
                  ? 'bg-gradient-to-r from-green-500 to-teal-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                {msg.sender === 'ai' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`p-3 rounded-2xl ${getMessageWidth(msg.content)} ${
                msg.sender === 'ai' 
                  ? 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
              }`}>
                <p className={`text-sm leading-relaxed break-words ${
                  msg.sender === 'ai' 
                    ? 'text-gray-800 dark:text-gray-200' 
                    : 'text-white'
                }`}>
                  {msg.content}
                </p>
                <p className={`text-xs mt-2 ${
                  msg.sender === 'ai' 
                    ? 'text-gray-500 dark:text-gray-400' 
                    : 'text-blue-100'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* AI Thinking Indicator */}
        {isAiThinking && (
          <motion.div
            variants={thinkingVariants}
            initial="initial"
            animate="animate"
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm max-w-[200px]">
                <div className="flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-3 items-end">
          {/* Input Field */}
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your Study Buddy anything..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
              disabled={isSending}
            />
          </div>
          
          {/* Send Button - Compact with icon only */}
          <motion.button
            whileHover={{ scale: isSending || !newMessage.trim() ? 1 : 1.05 }}
            whileTap={{ scale: isSending || !newMessage.trim() ? 1 : 0.95 }}
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            className={`p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 min-w-[52px] ${
              isSending || !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : 'shadow-lg'
            }`}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </motion.button>
        </div>
        
        {/* Helper Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </motion.div>
  );
};

export default Chat;