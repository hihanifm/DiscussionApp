const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../db/database');
const sseService = require('../services/sseService');

// GET /api/discussion/:contextId/comments - Get all comments for a context (threaded)
router.get('/:contextId/comments', async (req, res, next) => {
  try {
    const { contextId } = req.params;
    const { context_type = 'campaign' } = req.query;
    
    // Get all comments for this context with vote counts
    const comments = await allQuery(
      `SELECT c.*,
       COUNT(DISTINCT v.id) as vote_count,
       GROUP_CONCAT(DISTINCT v.user_id) as voters
       FROM discussion_comments c
       LEFT JOIN discussion_comment_votes v ON c.id = v.comment_id
       WHERE c.context_id = ? AND c.context_type = ?
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [contextId, context_type]
    );
    
    // Parse voters string to array
    const commentsWithVotes = comments.map(c => ({
      ...c,
      voters: c.voters ? c.voters.split(',') : [],
      vote_count: c.vote_count || 0
    }));
    
    // Build threaded structure
    const buildThread = (parentId = null) => {
      return commentsWithVotes
        .filter(c => (parentId === null ? !c.parent_id : c.parent_id === parentId))
        .map(comment => ({
          ...comment,
          replies: buildThread(comment.id)
        }));
    };
    
    const threadedComments = buildThread();
    
    res.json(threadedComments);
  } catch (error) {
    next(error);
  }
});

// POST /api/discussion/:contextId/comments - Create a new comment or reply
router.post('/:contextId/comments', async (req, res, next) => {
  try {
    const { contextId } = req.params;
    const { comment_text, parent_id, user_id, context_type = 'campaign' } = req.body;
    
    if (!comment_text || comment_text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    // If parent_id is provided, verify parent comment exists
    if (parent_id) {
      const parentComment = await getQuery(
        'SELECT * FROM discussion_comments WHERE id = ? AND context_id = ? AND context_type = ?',
        [parent_id, contextId, context_type]
      );
      
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }
    
    // Insert comment
    const result = await runQuery(
      'INSERT INTO discussion_comments (context_id, context_type, parent_id, user_id, comment_text) VALUES (?, ?, ?, ?, ?)',
      [contextId, context_type, parent_id || null, user_id || null, comment_text.trim()]
    );
    
    // Get the new comment with vote count
    const newComment = await getQuery(
      `SELECT c.*,
       COUNT(DISTINCT v.id) as vote_count
       FROM discussion_comments c
       LEFT JOIN discussion_comment_votes v ON c.id = v.comment_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [result.lastID]
    );
    
    // Broadcast update to all clients watching this context
    sseService.broadcast(contextId, {
      type: 'comment_created',
      comment: { ...newComment, vote_count: newComment.vote_count || 0, voters: [] }
    });
    
    res.status(201).json({ ...newComment, vote_count: newComment.vote_count || 0, voters: [] });
  } catch (error) {
    next(error);
  }
});

// POST /api/discussion/comments/:id/upvote - Toggle upvote on a comment
router.post('/comments/:id/upvote', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    // Check if comment exists
    const comment = await getQuery(
      'SELECT * FROM discussion_comments WHERE id = ?',
      [id]
    );
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user has already voted
    const existingVote = await getQuery(
      'SELECT * FROM discussion_comment_votes WHERE comment_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    let hasVoted = false;
    
    if (existingVote) {
      // Remove vote (toggle off)
      await runQuery(
        'DELETE FROM discussion_comment_votes WHERE comment_id = ? AND user_id = ?',
        [id, user_id]
      );
      hasVoted = false;
    } else {
      // Create vote (toggle on)
      await runQuery(
        'INSERT INTO discussion_comment_votes (comment_id, user_id) VALUES (?, ?)',
        [id, user_id]
      );
      hasVoted = true;
    }
    
    // Get updated vote count
    const voteCount = await getQuery(
      'SELECT COUNT(*) as count FROM discussion_comment_votes WHERE comment_id = ?',
      [id]
    );
    
    // Broadcast update
    sseService.broadcast(comment.context_id, {
      type: 'comment_vote_updated',
      comment_id: parseInt(id),
      vote_count: voteCount.count,
      hasVoted
    });
    
    res.json({ 
      success: true, 
      vote_count: voteCount.count,
      hasVoted
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/discussion/comments/:id - Delete a comment
router.delete('/comments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    // Get the comment
    const comment = await getQuery(
      'SELECT * FROM discussion_comments WHERE id = ?',
      [id]
    );
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user is the comment creator
    if (comment.user_id && comment.user_id !== user_id) {
      return res.status(403).json({ error: 'Only the comment creator can delete this comment' });
    }
    
    // Delete comment (CASCADE will delete all replies and votes)
    await runQuery(
      'DELETE FROM discussion_comments WHERE id = ?',
      [id]
    );
    
    // Broadcast deletion
    sseService.broadcast(comment.context_id, {
      type: 'comment_deleted',
      comment_id: parseInt(id)
    });
    
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
