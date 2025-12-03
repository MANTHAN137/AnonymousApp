import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { sendMessage, subscribeToMessages, deleteMessage, cleanupOldMessages } from '../services/chatService';
import { generateAnonymousName, getAvatarColor } from '../utils/nameGenerator';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

const GENERAL_CHAT_ID = "general_group_chat";

const Home = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anonymousName, setAnonymousName] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize Anonymous Identity
  useEffect(() => {
    if (currentUser?.uid) {
      const name = generateAnonymousName(currentUser.uid);
      setAnonymousName(name);
    }
  }, [currentUser]);

  // Subscribe to General Chat
  useEffect(() => {
    const unsubscribe = subscribeToMessages(GENERAL_CHAT_ID, (msgs) => {
      setMessages(msgs);
    });

    // Attempt to cleanup old messages on load
    cleanupOldMessages(GENERAL_CHAT_ID);

    return () => unsubscribe();
  }, []);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle mobile keyboard and viewport resizing
  useEffect(() => {
    const handleResize = () => {
      // Scroll to bottom when viewport resizes (e.g. keyboard opens)
      setTimeout(scrollToBottom, 100);
    };

    window.addEventListener('resize', handleResize);

    // Also try to use Visual Viewport API if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault(); // Handle both form submit and button click
    if (!newMessage.trim()) return;

    const msg = newMessage;
    setNewMessage('');
    setShowEmojiPicker(false);

    try {
      // Send with the anonymous name
      await sendMessage(GENERAL_CHAT_ID, msg, currentUser.uid, anonymousName);
    } catch (error) {
      console.error("Failed to send message", error);
      setNewMessage(msg);
    }
  };

  // Wrapper to handle button tap without losing focus
  const handleSendButton = (e) => {
    e.preventDefault(); // Prevent focus loss
    handleSend(e);
  };

  const handleDelete = async (messageId) => {
    if (window.confirm("Delete this message?")) {
      try {
        await deleteMessage(GENERAL_CHAT_ID, messageId);
      } catch (error) {
        console.error("Failed to delete message", error);
        alert("Failed to delete message");
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await logout();
      } catch (error) {
        console.error("Failed to log out", error);
      }
    }
  };

  const Avatar = ({ name, size = "w-10 h-10", fontSize = "text-sm" }) => {
    const color = getAvatarColor(name || "?");
    const initial = (name || "?").charAt(0).toUpperCase();

    return (
      <div
        className={`${size} rounded-full flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0`}
        style={{ backgroundColor: color }}
      >
        <span className={fontSize}>{initial}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-900 text-gray-100 overflow-hidden relative font-sans">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="glass-strong z-20 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-0.5 rounded-full">
            <Avatar name={anonymousName} size="w-10 h-10" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Global Room</h1>
            <p className="text-xs text-gray-400 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              You are <span className="text-purple-400 font-medium ml-1">{anonymousName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-white/10 transition text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-hide">
        {messages.map((msg, index) => {
          const isMe = msg.uid === currentUser.uid;
          const isSequential = index > 0 && messages[index - 1].uid === msg.uid;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
            >
              {!isMe && !isSequential && (
                <div className="mr-2 mt-1">
                  <Avatar name={msg.displayName} size="w-8 h-8" fontSize="text-xs" />
                </div>
              )}
              {!isMe && isSequential && <div className="w-10" />} {/* Spacer for alignment */}

              <div className={`max-w-[80%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && !isSequential && (
                  <span className="text-[10px] text-gray-400 ml-1 mb-0.5">{msg.displayName}</span>
                )}

                <div className={`px-4 py-2 rounded-2xl text-sm md:text-base shadow-sm backdrop-blur-sm
                  ${isMe
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-800/80 border border-gray-700/50 text-gray-200 rounded-tl-sm'
                  }
                `}>
                  {msg.text}
                </div>

                {/* Delete Button */}
                {(isMe || currentUser.email === 'indiakamanthan@gmail.com') && (
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="text-[10px] text-red-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:underline"
                  >
                    Delete
                  </button>
                )}

                {/* Timestamp - visible on hover or if last message */}
                <span className="text-[10px] text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 z-20 glass-strong border-t border-gray-800">
        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-16 left-0 z-30"
              >
                <EmojiPicker theme="dark" onEmojiClick={onEmojiClick} />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 text-gray-400 hover:text-purple-400 transition bg-gray-800/50 rounded-full hover:bg-gray-700/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </button>

          <form onSubmit={handleSend} className="flex-1 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => setTimeout(scrollToBottom, 300)} // Scroll when keyboard opens
              className="flex-1 bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 rounded-full px-5 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition w-full"
              placeholder="Type a message..."
            />
            <button
              type="button" // Changed to button to prevent form submission issues
              disabled={!newMessage.trim()}
              onClick={handleSendButton} // Use onClick for standard behavior
              onPointerDown={(e) => e.preventDefault()} // Prevent focus loss on touch
              className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 active:scale-95 z-50 touch-manipulation"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="transform rotate-0">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
