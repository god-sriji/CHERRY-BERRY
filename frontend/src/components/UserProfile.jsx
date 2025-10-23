import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI, chatAPI, userAPI, blockAPI } from '../services/api';
import './UserProfile.css';

const UserProfile = ({ userId, onClose }) => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchUserPosts();
      fetchFriendsCount();
      checkBlockStatus();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await userAPI.getUserById(userId);
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await postAPI.getUserPosts(userId);
      if (response.success) {
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendsCount = async () => {
    try {
      // Get all chats and count how many involve this user
      const response = await chatAPI.getChats();
      if (response.success) {
        const userChats = response.data.filter(chat => 
          chat.user1_id === userId || chat.user2_id === userId
        );
        setFriendsCount(userChats.length);
      }
    } catch (error) {
      console.error('Error fetching friends count:', error);
    }
  };

  const checkBlockStatus = async () => {
    try {
      const response = await blockAPI.checkBlockStatus(userId);
      if (response.success) {
        setIsBlocked(response.data.is_blocked);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleStartChat = async () => {
    try {
      const response = await chatAPI.createChat(userId);
      if (response.success) {
        onClose();
        // Navigate to chat - you can emit an event or use context
        window.dispatchEvent(new CustomEvent('navigateToChat', { detail: { chatId: response.data.chat_id } }));
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleBlockToggle = async () => {
    if (blockLoading) return;

    try {
      setBlockLoading(true);
      if (isBlocked) {
        // Unblock user
        const response = await blockAPI.unblockUser(userId);
        if (response.success) {
          setIsBlocked(false);
          alert('User unblocked successfully');
        }
      } else {
        // Block user
        const response = await blockAPI.blockUser(userId);
        if (response.success) {
          setIsBlocked(true);
          alert('User blocked successfully');
        }
      }
    } catch (error) {
      console.error('Error toggling block:', error);
      alert('Failed to update block status');
    } finally {
      setBlockLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="user-profile-modal">
        <div className="user-profile-content">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.user_id === userId;

  return (
    <div className="user-profile-modal" onClick={onClose}>
      <div className="user-profile-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-profile-btn" onClick={onClose}>✕</button>
        
        <div className="user-profile-header">
          <div className="user-profile-cover"></div>
          <div className="user-profile-info-section">
            <div className="user-profile-avatar-wrapper">
              {user.profile_pic ? (
                <img src={user.profile_pic} alt="Profile" className="user-profile-avatar-large" />
              ) : (
                <div className="user-profile-avatar-placeholder">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="user-profile-name">{user.username}</h2>
            <p className="user-profile-email">{user.email}</p>
            {user.bio && <p className="user-profile-bio">{user.bio}</p>}
            
            <div className="user-profile-stats">
              <div className="stat-item">
                <span className="stat-number">{posts.length}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{friendsCount}</span>
                <span className="stat-label">Friends</span>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="user-profile-actions">
                <button className="start-chat-btn" onClick={handleStartChat}>
                  💬 Message
                </button>
                <button 
                  className={`block-btn ${isBlocked ? 'unblock' : 'block'}`}
                  onClick={handleBlockToggle}
                  disabled={blockLoading}
                >
                  {blockLoading ? '...' : isBlocked ? '✓ Blocked' : '🚫 Block'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="user-profile-posts-section">
          <h3>Posts</h3>
          {posts.length === 0 ? (
            <div className="no-posts">
              <p>No posts yet</p>
            </div>
          ) : (
            <div className="user-profile-posts-grid">
              {posts.map((post) => (
                <div 
                  key={post.post_id} 
                  className="user-profile-post-item"
                  onClick={() => setSelectedPost(post)}
                >
                  {post.media_type === 'video' ? (
                    <video src={post.media_url} className="user-profile-post-thumbnail" />
                  ) : (
                    <img src={post.media_url} alt="Post" className="user-profile-post-thumbnail" />
                  )}
                  <div className="post-overlay">
                    <span>❤️ 0</span>
                    <span>💬 0</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Detail Modal */}
        {selectedPost && (
          <div className="post-detail-modal" onClick={() => setSelectedPost(null)}>
            <div className="post-detail-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-post-btn" onClick={() => setSelectedPost(null)}>✕</button>
              {selectedPost.media_type === 'video' ? (
                <video src={selectedPost.media_url} controls className="post-detail-media" />
              ) : (
                <img src={selectedPost.media_url} alt="Post" className="post-detail-media" />
              )}
              {selectedPost.caption && (
                <div className="post-detail-caption">
                  <strong>{user.username}</strong> {selectedPost.caption}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
