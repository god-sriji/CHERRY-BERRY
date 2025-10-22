import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    try {
      const response = await postAPI.getUserPosts(user.user_id);
      if (response.success) {
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await postAPI.deletePost(postId);
        if (response.success) {
          await fetchUserPosts();
          setSelectedPost(null);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-cover"></div>
        <div className="profile-info-section">
          <div className="profile-avatar-wrapper">
            {user.profile_pic ? (
              <img src={user.profile_pic} alt="Profile" className="profile-avatar-large" />
            ) : (
              <div className="profile-avatar-placeholder">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="profile-name">{user.username}</h2>
          <p className="profile-email">{user.email}</p>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <div className="profile-posts-section">
        <h3 className="section-title">My Posts</h3>
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="empty-posts">
            <span className="empty-icon">📝</span>
            <p>No posts yet. Create your first post!</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div 
                key={post.post_id} 
                className="post-card"
                onClick={() => setSelectedPost(post)}
              >
                {post.media_url ? (
                  <div className="post-thumbnail">
                    {post.media_type === 'video' ? (
                      <video 
                        src={`http://localhost:3002${post.media_url}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          console.error('Profile video failed to load:', `http://localhost:3002${post.media_url}`);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <img 
                        src={`http://localhost:3002${post.media_url}`} 
                        alt="Post"
                        onError={(e) => {
                          console.error('Profile image failed to load:', `http://localhost:3002${post.media_url}`);
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="post-caption-only">
                    <p>{post.caption}</p>
                  </div>
                )}
                <div className="post-overlay">
                  <span className="post-date">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Details</h3>
              <button className="close-btn" onClick={() => setSelectedPost(null)}>×</button>
            </div>
            <div className="modal-body-large">
              {selectedPost.media_url && (
                <div className="post-detail-image">
                  {selectedPost.media_type === 'video' ? (
                    <video 
                      src={`http://localhost:3002${selectedPost.media_url}`}
                      controls
                      style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                      onError={(e) => {
                        console.error('Modal video failed to load:', `http://localhost:3002${selectedPost.media_url}`);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <img 
                      src={`http://localhost:3002${selectedPost.media_url}`} 
                      alt="Post"
                      onError={(e) => {
                        console.error('Modal image failed to load:', `http://localhost:3002${selectedPost.media_url}`);
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}
              {selectedPost.caption && (
                <p className="post-detail-caption">{selectedPost.caption}</p>
              )}
              <p className="post-detail-date">
                Posted on {new Date(selectedPost.created_at).toLocaleDateString()}
              </p>
              <button 
                className="delete-post-btn"
                onClick={() => handleDeletePost(selectedPost.post_id)}
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
