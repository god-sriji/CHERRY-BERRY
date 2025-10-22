import { useState, useEffect } from 'react';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './FYP.css';

const FYP = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({
    caption: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Image, Step 2: Caption

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await postAPI.getAllPosts();
      if (response.success) {
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image or video
      const isVideo = file.type.startsWith('video/');
      setNewPost({ ...newPost, image: file, isVideo });
      setImagePreview(URL.createObjectURL(file));
      setStep(2); // Move to caption step
    }
  };

  const handleRemoveImage = () => {
    setNewPost({ ...newPost, image: null, isVideo: false });
    setImagePreview(null);
    setStep(1);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.caption && !newPost.image) {
      alert('Please add a caption or media');
      return;
    }

    try {
      setCreating(true);
      const formData = new FormData();
      if (newPost.caption) formData.append('caption', newPost.caption);
      if (newPost.image) formData.append('media', newPost.image);

      const response = await postAPI.createPost(formData);
      if (response.success) {
        setShowCreateModal(false);
        setNewPost({ caption: '', image: null });
        setImagePreview(null);
        setStep(1);
        await fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fyp-container">
      <div className="fyp-header">
        <div>
          <h2>For You 🎯</h2>
          <p>Discover posts from the community</p>
        </div>
        <button className="create-post-btn" onClick={() => setShowCreateModal(true)}>
          + Create Post
        </button>
      </div>

      <div className="fyp-content">
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <h3>No posts yet</h3>
            <p>Be the first to create a post!</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.post_id} className="post-card" onClick={() => setSelectedPost(post)} style={{cursor: 'pointer'}}>
                {post.media_url && (
                  <div className="post-image">
                    {post.media_type === 'video' ? (
                      <video 
                        src={`http://localhost:3002${post.media_url}`}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          console.error('Video failed to load:', `http://localhost:3002${post.media_url}`);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <img 
                        src={`http://localhost:3002${post.media_url}`} 
                        alt="Post"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                  </div>
                )}
                <div className="post-content">
                  <div className="post-author">
                    <div className="author-avatar">
                      {post.user?.profile_pic ? (
                        <img src={post.user.profile_pic} alt="Avatar" />
                      ) : (
                        <div className="avatar-placeholder">
                          {post.user?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="author-info">
                      <h4>{post.user?.username || 'Unknown User'}</h4>
                      <p>{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {post.caption && (
                    <p className="post-caption">{post.caption}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{step === 1 ? 'Choose Media' : 'Add Caption'}</h3>
              <button className="close-btn" onClick={() => {
                setShowCreateModal(false);
                setStep(1);
                setNewPost({ caption: '', image: null, isVideo: false });
                setImagePreview(null);
              }}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Step 1: Image Selection */}
              {step === 1 && (
                <div className="step-content">
                  {!imagePreview ? (
                    <div className="upload-area">
                      <label htmlFor="file-upload" className="upload-label">
                        <div className="upload-icon">📸</div>
                        <h4>Select a photo or video</h4>
                        <p>Click to browse your files</p>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleImageChange}
                          className="file-input-hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="image-selected">
                      <div className="image-preview-large">
                        {newPost.isVideo ? (
                          <video src={imagePreview} controls style={{ width: '100%', maxHeight: '400px' }} />
                        ) : (
                          <img src={imagePreview} alt="Preview" />
                        )}
                      </div>
                      <div className="image-actions">
                        <button type="button" className="change-image-btn" onClick={handleRemoveImage}>
                          Change {newPost.isVideo ? 'Video' : 'Image'}
                        </button>
                        <button type="button" className="skip-caption-btn" onClick={handleCreatePost} disabled={creating}>
                          {creating ? 'Posting...' : 'Post without caption'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Caption */}
              {step === 2 && (
                <form onSubmit={handleCreatePost} className="step-content">
                  <div className="caption-step">
                    <div className="image-preview-small">
                      {newPost.isVideo ? (
                        <video src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={imagePreview} alt="Preview" />
                      )}
                      <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>
                        ✕
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label>Write a caption</label>
                      <textarea
                        value={newPost.caption}
                        onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                        placeholder="What's on your mind?"
                        rows={6}
                        className="post-textarea"
                        autoFocus
                      />
                    </div>

                    <button type="submit" className="submit-btn" disabled={creating}>
                      {creating ? 'Posting...' : 'Share Post'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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
                    />
                  ) : (
                    <img 
                      src={`http://localhost:3002${selectedPost.media_url}`} 
                      alt="Post"
                    />
                  )}
                </div>
              )}
              {selectedPost.caption && (
                <div className="post-detail-caption">
                  <p>{selectedPost.caption}</p>
                </div>
              )}
              <div className="post-detail-info">
                <div className="post-author">
                  <div className="author-avatar">
                    {selectedPost.user?.profile_pic ? (
                      <img src={selectedPost.user.profile_pic} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        {selectedPost.user?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="author-info">
                    <h4>{selectedPost.user?.username || 'Unknown User'}</h4>
                    <p>{new Date(selectedPost.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FYP;
