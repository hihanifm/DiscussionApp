import { API_BASE_URL } from '../config/apiConfig';

export const api = {
  // Get all comments for a context
  getComments: async (contextId, contextType = 'campaign') => {
    const response = await fetch(`${API_BASE_URL}/discussion/${contextId}/comments?context_type=${contextType}`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  // Create a new comment or reply
  createComment: async (contextId, commentText, parentId = null, contextType = 'campaign', userId) => {
    const response = await fetch(`${API_BASE_URL}/discussion/${contextId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment_text: commentText,
        parent_id: parentId,
        user_id: userId,
        context_type: contextType,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create comment');
    }
    return response.json();
  },

  // Upvote a comment (thumbs-up toggle)
  upvoteComment: async (commentId, userId) => {
    const response = await fetch(`${API_BASE_URL}/discussion/comments/${commentId}/upvote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upvote');
    }
    return response.json();
  },

  // Delete a comment
  deleteComment: async (commentId, userId) => {
    const response = await fetch(`${API_BASE_URL}/discussion/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete comment');
    }
    return response.json();
  },
};
