import { useState, useEffect, useRef } from 'react';
import { chatAPI, userAPI, messageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import './Chat.css';

const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
    fetchAllUsers();
    
    // Connect to socket
    socketService.connect();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

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

      // Listen for new messages in real-time
      socketService.onNewMessage((newMessage) => {
        if (newMessage.chat_id === selectedChat.chat_id) {
          setMessages(prevMessages => {
            // Check if message already exists
            const exists = prevMessages.some(msg => msg.message_id === newMessage.message_id);
            if (!exists) {
              return [...prevMessages, newMessage];
            }
            return prevMessages;
          });
        }
      });

      // Listen for read status updates
      socketService.onMessagesRead(({ chatId }) => {
        if (chatId === selectedChat.chat_id) {
          // Update all sent messages to read
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.sender_id === user.user_id ? { ...msg, is_read: true } : msg
            )
          );
        }
      });
      
      return () => {
        // Leave the chat room and remove listeners
        socketService.leaveChat(selectedChat.chat_id);
        socketService.offNewMessage();
        socketService.offMessagesRead();
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
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    const tempMessage = {
      message_id: `temp-${Date.now()}`,
      message_text: newMessage.trim(),
      sender_id: user.user_id,
      sent_at: new Date().toISOString(),
      is_read: false,
      sending: true // Temporary flag for "waiting" state
    };

    try {
      setSendingMessage(true);
      // Add temp message immediately for instant feedback
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      const response = await messageAPI.sendMessage(selectedChat.chat_id, tempMessage.message_text);
      if (response.success) {
        // Remove temp message - real message will come via socket
        setMessages(msgs => msgs.filter(msg => msg.message_id !== tempMessage.message_id));
        await fetchChats(); // Refresh chat list to update last_message_at
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      // Remove the temp message on error
      setMessages(msgs => msgs.filter(msg => msg.message_id !== tempMessage.message_id));
    } finally {
      setSendingMessage(false);
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
        <div className="chat-sidebar">
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
                    <h4>{chat.other_user?.username || 'Unknown User'}</h4>
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
        <div className="chat-messages">
          {!selectedChat ? (
            <div className="empty-state">
              <span className="empty-icon">💬</span>
              <h3>Select a chat to start messaging</h3>
              <p>Chat with your connections</p>
            </div>
          ) : (
            <div className="message-view">
              <div className="message-header">
                <div className="message-header-user">
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
                            <p>{msg.message_text}</p>
                            <div className="message-footer">
                              <span className="message-time">
                                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.sender_id === user.user_id && (
                                <span 
                                  className={`message-status ${msg.sending ? 'sending' : msg.is_read ? 'read' : 'sent'}`}
                                  title={msg.sending ? 'Sending...' : msg.is_read ? 'Read' : 'Sent'}
                                >
                                  {msg.sending ? '🕐' : msg.is_read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                            {msg.sender_id === user.user_id && !msg.sending && (
                              <div className="message-actions">
                                <button 
                                  onClick={() => startEditing(msg)}
                                  className="message-action-btn"
                                  title="Edit message"
                                >
                                  ✏️
                                </button>
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
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="message-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendingMessage}
                />
                <button type="submit" className="send-btn" disabled={sendingMessage || !newMessage.trim()}>
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
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
    </div>
  );
};

export default Chat;
