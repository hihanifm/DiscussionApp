import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getUserId } from '@townhall/shared/utils/userId';
import { SSE_BASE_URL } from '../config/apiConfig';
import Comment from './Comment';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import './DiscussionSection.css';

function DiscussionSection({ contextId, contextType = 'campaign' }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Load sort preference from localStorage, default to 'newest'
  const [sortBy, setSortBy] = useState(() => {
    const saved = localStorage.getItem('discussion-sort-preference');
    return saved || 'newest';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const userId = getUserId();

  // Save sort preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('discussion-sort-preference', sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (contextId) {
      loadComments();
    }
  }, [contextId, contextType]);

  // SSE connection for real-time updates
  useEffect(() => {
    if (!contextId) return;

    const eventSource = new EventSource(`${SSE_BASE_URL}/discussion/${contextId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          console.log('SSE connected for context:', contextId);
          break;
        case 'comment_created':
          // Add new comment to state without reloading all comments
          setComments(prevComments => {
            const newComment = {
              ...data.comment,
              replies: [],
              voters: []
            };
            
            // If it's a reply, add it to the parent's replies
            if (newComment.parent_id) {
              const addReplyToParent = (comment) => {
                if (comment.id === newComment.parent_id) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newComment]
                  };
                }
                if (comment.replies) {
                  return {
                    ...comment,
                    replies: comment.replies.map(addReplyToParent)
                  };
                }
                return comment;
              };
              return prevComments.map(addReplyToParent);
            }
            
            // If it's a top-level comment, add it to the beginning
            return [newComment, ...prevComments];
          });
          break;
        case 'comment_vote_updated':
          setComments(prevComments => {
            const updateComment = (comment) => {
              if (comment.id === data.comment_id) {
                return { ...comment, vote_count: data.vote_count };
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: comment.replies.map(updateComment)
                };
              }
              return comment;
            };
            return prevComments.map(updateComment);
          });
          break;
        case 'comment_deleted':
          // Remove comment from state without reloading all comments
          setComments(prevComments => {
            const removeComment = (comment) => {
              if (comment.id === data.comment_id) {
                return null; // Mark for removal
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: comment.replies.map(removeComment).filter(c => c !== null)
                };
              }
              return comment;
            };
            return prevComments.map(removeComment).filter(c => c !== null);
          });
          break;
        default:
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [contextId]);

  const loadComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getComments(contextId, contextType);
      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createComment(contextId, newComment, null, contextType, userId);
      setNewComment('');
      // Don't reload - SSE will handle the update
    } catch (err) {
      alert(err.message || 'Failed to create comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // These callbacks are kept for backward compatibility but SSE handles updates
  const handleCommentCreated = () => {
    // SSE will handle the update, no need to reload
  };

  const handleCommentDeleted = () => {
    // SSE will handle the update, no need to reload
  };

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'best':
        return (b.vote_count || 0) - (a.vote_count || 0);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Filter comments by search query
  const filteredComments = searchQuery.trim()
    ? sortedComments.filter(comment => {
        const matchesComment = comment.comment_text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesReplies = comment.replies?.some(reply => 
          reply.comment_text.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return matchesComment || matchesReplies;
      })
    : sortedComments;

  if (!contextId) {
    return (
      <div className="discussion-section">
        <p>Please provide a contextId to load discussions</p>
      </div>
    );
  }

  return (
    <div className="discussion-section">
      <div className="discussion-header">
        <h2>Discussion</h2>
        <p className="discussion-subtitle">Join the conversation</p>
      </div>

      {/* Comment Input */}
      <form className="comment-input-form" onSubmit={handleSubmit}>
        <AutoExpandingTextarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Join the conversation"
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Sort and Search Controls */}
      <div className="discussion-controls">
        <div className="sort-control">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="best">Best</option>
          </select>
        </div>
        <div className="search-control">
          <input
            type="text"
            placeholder="Search Comments"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="discussion-loading">Loading comments...</div>
      ) : error ? (
        <div className="discussion-error">Error: {error}</div>
      ) : filteredComments.length === 0 ? (
        <div className="discussion-empty">
          {searchQuery ? 'No comments match your search.' : 'No comments yet. Be the first to comment!'}
        </div>
      ) : (
        <div className="comments-list">
          {filteredComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              contextId={contextId}
              contextType={contextType}
              onCommentCreated={handleCommentCreated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DiscussionSection;
