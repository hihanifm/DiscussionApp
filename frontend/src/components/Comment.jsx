import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getUserId } from '../utils/userId';
import { formatRelativeTime } from '../utils/dateFormat';
import './Comment.css';

function Comment({ comment, contextId, contextType, onCommentCreated, onCommentDeleted, depth = 0 }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [voteCount, setVoteCount] = useState(comment.vote_count || 0);
  const [hasVoted, setHasVoted] = useState(
    comment.voters && comment.voters.includes(getUserId())
  );

  const userId = getUserId();
  const isCommentCreator = comment.user_id && comment.user_id === userId;
  const maxDepth = 5; // Limit nesting depth

  // Sync local state with prop changes (from SSE updates)
  useEffect(() => {
    setVoteCount(comment.vote_count || 0);
    if (comment.voters) {
      setHasVoted(comment.voters.includes(getUserId()));
    }
  }, [comment.vote_count, comment.voters]);

  const handleUpvote = async () => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      const result = await api.upvoteComment(comment.id, userId);
      setVoteCount(result.vote_count);
      setHasVoted(result.hasVoted);
    } catch (error) {
      console.error('Error upvoting:', error);
      alert(error.message || 'Failed to upvote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createComment(contextId, replyText, comment.id, contextType, userId);
      setReplyText('');
      setIsReplying(false);
      // SSE will handle the update, callback is optional
      if (onCommentCreated) {
        onCommentCreated();
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      alert(error.message || 'Failed to create reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment? This will also delete all replies.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteComment(comment.id, userId);
      // SSE will handle the update, callback is optional
      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(error.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`comment ${depth > 0 ? 'comment-reply' : ''}`} style={{ marginLeft: `${depth * 24}px` }}>
      <div className="comment-content">
        <div className="comment-header">
          <div className="comment-author">
            <span className="comment-avatar">👤</span>
            <span className="comment-username">
              {comment.user_id ? `User_${comment.user_id.substring(0, 8)}` : 'Anonymous'}
            </span>
            <span className="comment-time">{formatRelativeTime(comment.created_at)}</span>
          </div>
        </div>
        
        <div className="comment-text">{comment.comment_text}</div>
        
        <div className="comment-actions">
          <button
            className={`comment-upvote ${hasVoted ? 'voted' : ''}`}
            onClick={handleUpvote}
            disabled={isVoting}
            title="Upvote"
          >
            <span className="upvote-icon">👍</span>
            <span className="upvote-count">{voteCount > 0 ? voteCount : ''}</span>
          </button>
          
          {depth < maxDepth && (
            <button
              className="comment-reply-btn"
              onClick={() => setIsReplying(!isReplying)}
              disabled={isDeleting}
            >
              Reply
            </button>
          )}
          
          {isCommentCreator && (
            <button
              className="comment-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : 'Delete'}
            </button>
          )}
        </div>
        
        {isReplying && (
          <form className="comment-reply-form" onSubmit={handleReply}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows="3"
              disabled={isSubmitting}
            />
            <div className="reply-form-actions">
              <button type="submit" disabled={isSubmitting || !replyText.trim()}>
                {isSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button type="button" onClick={() => { setIsReplying(false); setReplyText(''); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              contextId={contextId}
              contextType={contextType}
              onCommentCreated={onCommentCreated}
              onCommentDeleted={onCommentDeleted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Comment;
