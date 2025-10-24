import { useState, useEffect, useRef } from 'react';
import { chatAPI, userAPI, messageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import UserProfile from './UserProfile';
import './Chat.css';

const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({}); // Track unread counts per chat
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mark messages as read when viewing a chat
  const markMessagesAsRead = async (chatId) => {
    try {
      // Get unread messages from the other user
      const unreadMsgs = messages.filter(m => m.sender_id !== user.user_id && !m.is_read);
      
      if (unreadMsgs.length > 0) {
        // Call backend to mark as read
        await messageAPI.markAsRead(chatId);
        
        // Update local state
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.sender_id !== user.user_id ? { ...msg, is_read: true } : msg
          )
        );
        
        // Emit read event via socket to notify sender in real-time
        socketService.socket?.emit('mark_messages_read', { chatId, userId: user.user_id });
        console.log('✅ Messages marked as read via socket');
        
        // Clear unread count for this chat
        setUnreadMessages(prev => ({ ...prev, [chatId]: 0 }));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchAllUsers();
    
    // Connect to socket and register user
    socketService.connect();
    if (user?.user_id) {
      socketService.registerUser(user.user_id);
    }

    // Listen for new chats
    socketService.onNewChat(({ chat, otherUserId }) => {
      console.log('📨 New chat received via socket:', chat);
      
      // Fetch the other user's info
      userAPI.getUserById(otherUserId).then(response => {
        if (response.success) {
          const otherUser = response.data;
          const chatWithUser = {
            ...chat,
            otherUser: otherUser
          };
          
          setChats(prevChats => {
            // Check if chat already exists
            const exists = prevChats.some(c => c.chat_id === chat.chat_id);
            if (!exists) {
              console.log('✅ Adding new chat to list');
              return [...prevChats, chatWithUser];
            }
            console.log('⚠️ Chat already exists, skipping');
            return prevChats;
          });
        }
      }).catch(err => {
        console.error('Error fetching other user info:', err);
      });
    });

    // Cleanup on unmount
    return () => {
      socketService.offNewChat();
      socketService.disconnect();
    };
  }, [user?.user_id]);

  // Restore selected chat from localStorage after chats are loaded
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      const savedChatId = localStorage.getItem('selectedChatId');
      if (savedChatId) {
        const chat = chats.find(c => c.chat_id === parseInt(savedChatId));
        if (chat) {
          setSelectedChat(chat);
        }
      }
    }
  }, [chats]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.chat_id);
      // Save selected chat ID to localStorage
      localStorage.setItem('selectedChatId', selectedChat.chat_id.toString());
      
      // Join the chat room via socket
      socketService.joinChat(selectedChat.chat_id);

      // Mark messages as read
      setTimeout(() => {
        markMessagesAsRead(selectedChat.chat_id);
      }, 500);

      // Listen for new messages in real-time
      socketService.onNewMessage((newMessage) => {
        console.log('📩 Received new message via socket:', newMessage);
        if (newMessage.chat_id === selectedChat.chat_id) {
          setMessages(prevMessages => {
            // Check if message already exists
            const exists = prevMessages.some(msg => msg.message_id === newMessage.message_id);
            if (!exists) {
              console.log('✅ Adding message to chat');
              return [...prevMessages, newMessage];
            }
            console.log('⚠️ Message already exists, skipping');
            return prevMessages;
          });
        }
      });

      // Listen for read status updates
      socketService.onMessagesRead(({ chatId }) => {
        if (chatId === selectedChat.chat_id) {
          // Update all sent messages to read in real-time
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.sender_id === user.user_id ? { ...msg, is_read: true } : msg
            )
          );
          console.log('✅ Received read receipt via socket');
        }
      });

      // Listen for message updates (edits)
      socketService.onMessageUpdated((updatedMessage) => {
        console.log('✏️ Message updated via socket:', updatedMessage);
        if (updatedMessage.chat_id === selectedChat.chat_id) {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.message_id === updatedMessage.message_id ? updatedMessage : msg
            )
          );
        }
      });
      
      return () => {
        // Leave the chat room and remove listeners
        socketService.leaveChat(selectedChat.chat_id);
        socketService.offNewMessage();
        socketService.offMessagesRead();
        socketService.offMessageUpdated();
      };
    }
  }, [selectedChat, user.user_id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getChats();
      if (response.success) {
        setChats(response.data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      if (response.success) {
        // Filter out current user
        setAllUsers(response.data.filter(u => u.user_id !== user.user_id));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await messageAPI.getMessages(chatId);
      if (response.success) {
        setMessages(response.data);
        
        // Count unread messages from the other user
        const unreadCount = response.data.filter(m => m.sender_id !== user.user_id && !m.is_read).length;
        setUnreadMessages(prev => ({ ...prev, [chatId]: unreadCount }));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateChat = async (userId) => {
    try {
      const response = await chatAPI.createChat(userId);
      if (response.success) {
        await fetchChats();
        setShowNewChatModal(false);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaFile) || !selectedChat || sendingMessage) return;

    const messageText = newMessage.trim();
    const file = mediaFile;
    setNewMessage(''); // Clear input immediately
    setMediaFile(null);
    setMediaPreview(null);

    try {
      setSendingMessage(true);
      console.log('📤 Sending message:', messageText || 'Media file');
      
      let response;
      if (file) {
        // Send media message
        response = await messageAPI.sendMediaMessage(selectedChat.chat_id, file, messageText);
      } else {
        // Send text message
        response = await messageAPI.sendMessage(selectedChat.chat_id, messageText);
      }
      
      if (response.success) {
        console.log('✅ Message sent successfully:', response.data);
        // Message will be added via socket, but if socket fails, add it manually
        setTimeout(() => {
          setMessages(prev => {
            const exists = prev.some(msg => msg.message_id === response.data.message_id);
            if (!exists) {
              console.log('⚠️ Socket didnt add message, adding manually');
              return [...prev, response.data];
            }
            return prev;
          });
        }, 100);
        
        await fetchChats(); // Refresh chat list to update last_message_at
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      setNewMessage(messageText); // Restore message on error
      setMediaFile(file);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      
      // Create preview for images and videos
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview({
          url: reader.result,
          type: file.type.split('/')[0] // 'image', 'video', or 'audio'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearMediaPreview = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editingMessageText.trim()) return;

    try {
      const response = await messageAPI.editMessage(messageId, editingMessageText.trim());
      if (response.success) {
        setMessages(messages.map(msg => 
          msg.message_id === messageId ? response.data : msg
        ));
        setEditingMessageId(null);
        setEditingMessageText('');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await messageAPI.deleteMessage(messageId);
      if (response.success) {
        setMessages(messages.filter(msg => msg.message_id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const startEditing = (message) => {
    setEditingMessageId(message.message_id);
    setEditingMessageText(message.message_text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {/* Left Sidebar - Chat List */}
        <div className={`chat-sidebar ${selectedChat ? 'mobile-hidden' : ''}`}>
          <div className="chat-sidebar-header">
            <h3>Messages 💬</h3>
            <button 
              className="new-chat-btn"
              onClick={() => setShowNewChatModal(true)}
            >
              + New Chat
            </button>
          </div>
          
          <div className="chat-list">
            {loading ? (
              <div className="loading">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="empty-chat-list">
                <p>No chats yet</p>
                <p className="hint">Click "New Chat" to start</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.chat_id}
                  className={`chat-item ${selectedChat?.chat_id === chat.chat_id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-item-avatar">
                    {chat.other_user?.profile_pic ? (
                      <img src={chat.other_user.profile_pic} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        {chat.other_user?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="chat-item-info">
                    <h4>
                      <span>{chat.other_user?.username || 'Unknown User'}</span>
                      {unreadMessages[chat.chat_id] > 0 && (
                        <span className="unread-indicator">
                          <span className="unread-dot"></span>
                          <span className="unread-badge">{unreadMessages[chat.chat_id]}</span>
                        </span>
                      )}
                    </h4>
                    <p className="last-message-time">
                      {new Date(chat.last_message_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Messages */}
        <div className={`chat-messages ${selectedChat ? 'mobile-visible' : ''}`}>
          {!selectedChat ? (
            <div className="empty-state">
              <span className="empty-icon">💬</span>
              <h3>Select a chat to start messaging</h3>
              <p>Chat with your connections</p>
            </div>
          ) : (
            <div className="message-view">
              <div className="message-header">
                <button 
                  className="mobile-back-btn"
                  onClick={() => setSelectedChat(null)}
                >
                  ← Back
                </button>
                <div 
                  className="message-header-user" 
                  onClick={() => setViewingUserId(selectedChat.other_user?.user_id)}
                  style={{ cursor: 'pointer' }}
                >
                  {selectedChat.other_user?.profile_pic ? (
                    <img src={selectedChat.other_user.profile_pic} alt="Avatar" className="header-avatar" />
                  ) : (
                    <div className="header-avatar-placeholder">
                      {selectedChat.other_user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <h3>{selectedChat.other_user?.username || 'Unknown User'}</h3>
                </div>
              </div>
              <div className="message-content">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((msg) => (
                      <div 
                        key={msg.message_id} 
                        className={`message ${msg.sender_id === user.user_id ? 'sent' : 'received'}`}
                      >
                        {editingMessageId === msg.message_id ? (
                          <div className="message-edit-form">
                            <input
                              type="text"
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleEditMessage(msg.message_id);
                                } else if (e.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                              className="message-edit-input"
                              autoFocus
                            />
                            <div className="message-edit-actions">
                              <button 
                                type="button" 
                                onClick={() => handleEditMessage(msg.message_id)}
                                className="edit-save-btn"
                              >
                                ✓
                              </button>
                              <button 
                                type="button" 
                                onClick={cancelEditing}
                                className="edit-cancel-btn"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="message-bubble">
                            {/* Render media based on message type */}
                            {msg.message_type === 'image' && (
                              <div className="message-media">
                                <img 
                                  src={msg.message_text} 
                                  alt="Shared image" 
                                  className="message-image"
                                  onClick={() => window.open(msg.message_text, '_blank')}
                                />
                              </div>
                            )}
                            {msg.message_type === 'video' && (
                              <div className="message-media">
                                <video 
                                  src={msg.message_text} 
                                  controls 
                                  className="message-video"
                                />
                              </div>
                            )}
                            {msg.message_type === 'audio' && (
                              <div className="message-media">
                                <audio 
                                  src={msg.message_text} 
                                  controls 
                                  className="message-audio"
                                />
                              </div>
                            )}
                            {msg.message_type === 'text' && (
                              <p>{msg.message_text}</p>
                            )}
                            <div className="message-footer">
                              <span className="message-time">
                                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.sender_id === user.user_id && (
                                <span 
                                  className={`message-status ${msg.is_read ? 'read' : 'sent'}`}
                                  title={msg.is_read ? 'Read' : 'Sent'}
                                >
                                  {msg.is_read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                            {msg.sender_id === user.user_id && (
                              <div className="message-actions">
                                {msg.message_type === 'text' && (
                                  <button 
                                    onClick={() => startEditing(msg)}
                                    className="message-action-btn"
                                    title="Edit message"
                                  >
                                    ✏️
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteMessage(msg.message_id)}
                                  className="message-action-btn"
                                  title="Delete message"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="message-input-container">
                {/* Media Preview */}
                {mediaPreview && (
                  <div className="media-preview">
                    {mediaPreview.type === 'image' && (
                      <img src={mediaPreview.url} alt="Preview" className="preview-image" />
                    )}
                    {mediaPreview.type === 'video' && (
                      <video src={mediaPreview.url} controls className="preview-video" />
                    )}
                    {mediaPreview.type === 'audio' && (
                      <audio src={mediaPreview.url} controls className="preview-audio" />
                    )}
                    <button 
                      type="button" 
                      onClick={clearMediaPreview} 
                      className="clear-preview-btn"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="input-row">
                  {/* File input buttons */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*,audio/*"
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="attach-btn"
                    title="Attach media"
                    disabled={sendingMessage}
                  >
                    📎
                  </button>
                  
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="message-input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendingMessage}
                  />
                  <button 
                    type="submit" 
                    className="send-btn" 
                    disabled={sendingMessage || (!newMessage.trim() && !mediaFile)}
                  >
                    {sendingMessage ? '⏳' : '📤'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start New Chat</h3>
              <button className="close-btn" onClick={() => setShowNewChatModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="users-list">
                {allUsers.map((u) => (
                  <div
                    key={u.user_id}
                    className="user-item"
                    onClick={() => handleCreateChat(u.user_id)}
                  >
                    <div className="user-avatar">
                      {u.profile_pic ? (
                        <img src={u.profile_pic} alt="Avatar" />
                      ) : (
                        <div className="avatar-placeholder">
                          {u.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <h4>{u.username || 'Unknown User'}</h4>
                      <p>{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {viewingUserId && (
        <UserProfile 
          userId={viewingUserId} 
          onClose={() => setViewingUserId(null)} 
        />
      )}
    </div>
  );
};

export default Chat;
