import { useState, useEffect, useRef } from 'react';
import { postAPI, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserProfile from './UserProfile';
import './FYP.css';

const FYP = () => {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState([]); // All posts from backend
  const [posts, setPosts] = useState([]); // Currently loaded posts (pagination)
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(0); // Current page for pagination
  const [hasMore, setHasMore] = useState(true); // Whether more posts exist
  const [newPost, setNewPost] = useState({
    caption: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Image, Step 2: Caption
  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [viewingUserId, setViewingUserId] = useState(null);
  const [mutedVideos, setMutedVideos] = useState({}); // Track muted state per video
  const pressTimer = useRef(null); // For long press detection
  const [postStats, setPostStats] = useState({}); // Random likes and comments per post

  const POSTS_PER_PAGE = 3;

  // Generate random stats for a post
  const generatePostStats = (postId) => {
    if (!postStats[postId]) {
      const likes = Math.floor(Math.random() * (18000 - 400 + 1)) + 400; // 400 to 18000
      const comments = Math.floor(likes * (Math.random() * 0.2 + 0.3)); // 30-50% of likes
      setPostStats(prev => ({
        ...prev,
        [postId]: { likes, comments }
      }));
    }
  };

  // Format number to k notation
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  useEffect(() => {
    // Load initial posts
    if (allPosts.length > 0 && posts.length === 0) {
      loadMorePosts();
    }
  }, [allPosts]);

  useEffect(() => {
    // Generate stats for all loaded posts
    posts.forEach(post => {
      generatePostStats(post.post_id);
    });
  }, [posts]);

  useEffect(() => {
    // Play current video, pause others
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          // Ensure video is ready before playing
          if (video.readyState >= 3) { // HAVE_FUTURE_DATA or more
            video.play().catch(e => console.log('Autoplay prevented:', e));
          } else {
            // Wait for video to be ready
            video.addEventListener('loadeddata', () => {
              if (index === currentIndex) {
                video.play().catch(e => console.log('Autoplay prevented:', e));
              }
            }, { once: true });
          }
        } else {
          video.pause();
        }
      }
    });

    // Load more posts when nearing the end
    if (currentIndex >= posts.length - 1 && hasMore && !loading) {
      loadMorePosts();
    }
  }, [currentIndex]);

  const fetchAllPosts = async () => {
    try {
      const response = await postAPI.getAllPosts();
      if (response.success) {
        setAllPosts(response.data);
        setHasMore(response.data.length > POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = () => {
    const startIndex = page * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const newPosts = allPosts.slice(startIndex, endIndex);
    
    if (newPosts.length > 0) {
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setPage(prevPage => prevPage + 1);
      setHasMore(endIndex < allPosts.length);
    } else {
      setHasMore(false);
    }
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2000);
  };

  const handleScroll = (e) => {
    const container = e.target;
    const scrollPosition = container.scrollTop;
    const windowHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / windowHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleVideoClick = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      // Toggle mute/unmute
      video.muted = !video.muted;
      setMutedVideos(prev => ({ ...prev, [index]: video.muted }));
    }
  };

  const handleVideoLongPressStart = (index) => {
    pressTimer.current = setTimeout(() => {
      const video = videoRefs.current[index];
      if (video) {
        if (video.paused) {
          video.play().catch(err => console.log('Play error:', err));
        } else {
          video.pause();
        }
      }
    }, 500); // 500ms long press
  };

  const handleVideoLongPressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
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
        // Add new post to the beginning
        setAllPosts(prevPosts => [response.data, ...prevPosts]);
        setPosts(prevPosts => [response.data, ...prevPosts]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fyp-reels-container">
      {/* Header */}
      <div className="reels-header">
        <h2>Reels</h2>
        <button className="create-reel-btn" onClick={() => setShowCreateModal(true)}>
          <span className="plus-icon">+</span>
        </button>
      </div>

      {/* Reels Content */}
      <div 
        className="reels-scroll-container" 
        ref={containerRef}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="reels-loading">
            <div className="spinner"></div>
            <p>Loading reels...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="reels-empty">
            <span className="empty-icon">🎬</span>
            <h3>No posts yet</h3>
            <p>Be the first to create a reel!</p>
            <button className="create-first-btn" onClick={() => setShowCreateModal(true)}>
              Create First Reel
            </button>
          </div>
        ) : (
          posts.map((post, index) => (
            <div key={post.post_id} className="reel-item">
              {/* Media */}
              <div className="reel-media">
                {post.media_url && (
                  post.media_type === 'video' ? (
                    <>
                      <video 
                        ref={(el) => videoRefs.current[index] = el}
                        src={`${BASE_URL}${post.media_url}`}
                        loop
                        playsInline
                        muted={mutedVideos[index] !== false} // Default muted, track per video
                        preload="auto"
                        crossOrigin="anonymous"
                        className="reel-video"
                        onClick={() => handleVideoClick(index)}
                        onMouseDown={() => handleVideoLongPressStart(index)}
                        onMouseUp={handleVideoLongPressEnd}
                        onMouseLeave={handleVideoLongPressEnd}
                        onTouchStart={() => handleVideoLongPressStart(index)}
                        onTouchEnd={handleVideoLongPressEnd}
                        onError={(e) => {
                          console.error('Video failed to load:', e.target.src);
                          e.target.style.display = 'none';
                        }}
                        onLoadedData={(e) => {
                          console.log('Video loaded successfully:', e.target.src);
                          // Auto-play if this is the current video
                          if (index === currentIndex) {
                            e.target.play().catch(err => console.log('Auto-play prevented:', err));
                          }
                        }}
                      />
                      {/* Mute indicator */}
                      {mutedVideos[index] !== false && (
                        <div className="mute-indicator">
                          🔇
                        </div>
                      )}
                    </>
                  ) : (
                    <img 
                      src={`${BASE_URL}${post.media_url}`} 
                      alt="Reel"
                      className="reel-image"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )
                )}
              </div>

              {/* Overlay Info */}
              <div className="reel-overlay">
                {/* Bottom Info */}
                <div className="reel-info">
                  <div className="reel-author" onClick={() => setViewingUserId(post.user?.user_id)} style={{ cursor: 'pointer' }}>
                    <div className="author-avatar-small">
                      {post.user?.profile_pic ? (
                        <img src={post.user.profile_pic} alt="Avatar" />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {post.user?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <span className="author-username">@{post.user?.username || 'unknown'}</span>
                  </div>
                  {post.caption && (
                    <p className="reel-caption">{post.caption}</p>
                  )}
                  <p className="reel-date">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>

                {/* Side Actions */}
                <div className="reel-actions">
                  <button className="action-btn" onClick={() => showToast('Coming soon! ❤️')}>
                    <span>❤️</span>
                    <span className="action-count">
                      {postStats[post.post_id] ? formatNumber(postStats[post.post_id].likes) : '0'}
                    </span>
                  </button>
                  <button className="action-btn" onClick={() => showToast('Coming soon! 💬')}>
                    <span>💬</span>
                    <span className="action-count">
                      {postStats[post.post_id] ? formatNumber(postStats[post.post_id].comments) : '0'}
                    </span>
                  </button>
                  <button className="action-btn" onClick={() => showToast('Coming soon! 📤')}>
                    <span>📤</span>
                  </button>
                </div>
              </div>
            </div>
          ))
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

      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-notification">
          {toast.message}
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

export default FYP;
