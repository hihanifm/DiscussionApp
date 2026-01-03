/**
 * Tests for discussion API routes
 */

const request = require('supertest');
const express = require('express');
const discussionRouter = require('../../src/routes/discussion');
const {
  initTestDatabase,
  closeTestDatabase,
  runQuery,
  getQuery,
  clearTestDatabase
} = require('../../tests/setup');

// Mock database module to use test database
jest.mock('../../src/db/database', () => {
  const testDb = require('../../tests/setup');
  return {
    allQuery: (...args) => testDb.allQuery(...args),
    getQuery: (...args) => testDb.getQuery(...args),
    runQuery: (...args) => testDb.runQuery(...args)
  };
});

// Mock SSE service
jest.mock('../../src/services/sseService', () => ({
  broadcast: jest.fn()
}));

// Get the mocked broadcast function
const sseService = require('../../src/services/sseService');

const app = express();
app.use(express.json());
app.use('/api/discussion', discussionRouter);

describe('Discussion API', () => {
  const testContextId = 'test-context-123';
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    jest.clearAllMocks();
  });

  describe('GET /api/discussion/:contextId/comments', () => {
    test('should return empty array when no comments exist', async () => {
      const response = await request(app)
        .get(`/api/discussion/${testContextId}/comments`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test('should return threaded comments with vote counts', async () => {
      // Create a top-level comment
      const commentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Test comment']
      );

      const commentId = commentResult.lastID;

      // Add a vote
      await runQuery(
        'INSERT INTO discussion_comment_votes (comment_id, user_id) VALUES (?, ?)',
        [commentId, testUserId]
      );

      // Create a reply
      await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, parent_id, user_id, comment_text) VALUES (?, ?, ?, ?, ?)',
        [testContextId, 'campaign', commentId, testUserId, 'Test reply']
      );

      const response = await request(app)
        .get(`/api/discussion/${testContextId}/comments`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].comment_text).toBe('Test comment');
      expect(response.body[0].vote_count).toBe(1);
      expect(response.body[0].replies).toHaveLength(1);
      expect(response.body[0].replies[0].comment_text).toBe('Test reply');
    });

    test('should filter by context_type', async () => {
      await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Campaign comment']
      );

      await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'other', testUserId, 'Other comment']
      );

      const response = await request(app)
        .get(`/api/discussion/${testContextId}/comments?context_type=campaign`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].comment_text).toBe('Campaign comment');
    });
  });

  describe('POST /api/discussion/:contextId/comments', () => {
    test('should create a new top-level comment', async () => {
      const response = await request(app)
        .post(`/api/discussion/${testContextId}/comments`)
        .send({
          comment_text: 'New comment',
          user_id: testUserId,
          context_type: 'campaign'
        })
        .expect(201);

      expect(response.body.comment_text).toBe('New comment');
      expect(response.body.context_id).toBe(testContextId);
      expect(response.body.user_id).toBe(testUserId);
      expect(response.body.parent_id).toBeNull();
      expect(response.body.vote_count).toBe(0);

      // Verify SSE broadcast was called
      expect(sseService.broadcast).toHaveBeenCalledWith(
        testContextId,
        expect.objectContaining({
          type: 'comment_created',
          comment: expect.objectContaining({
            comment_text: 'New comment'
          })
        })
      );
    });

    test('should create a reply to an existing comment', async () => {
      // Create parent comment
      const parentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Parent comment']
      );

      const response = await request(app)
        .post(`/api/discussion/${testContextId}/comments`)
        .send({
          comment_text: 'Reply comment',
          parent_id: parentResult.lastID,
          user_id: testUserId,
          context_type: 'campaign'
        })
        .expect(201);

      expect(response.body.comment_text).toBe('Reply comment');
      expect(response.body.parent_id).toBe(parentResult.lastID);
    });

    test('should reject comment with empty text', async () => {
      const response = await request(app)
        .post(`/api/discussion/${testContextId}/comments`)
        .send({
          comment_text: '   ',
          user_id: testUserId
        })
        .expect(400);

      expect(response.body.error).toContain('Comment text is required');
    });

    test('should reject reply to non-existent parent', async () => {
      const response = await request(app)
        .post(`/api/discussion/${testContextId}/comments`)
        .send({
          comment_text: 'Reply',
          parent_id: 99999,
          user_id: testUserId,
          context_type: 'campaign'
        })
        .expect(404);

      expect(response.body.error).toContain('Parent comment not found');
    });
  });

  describe('POST /api/discussion/comments/:id/upvote', () => {
    test('should add upvote to a comment', async () => {
      // Create a comment
      const commentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Test comment']
      );

      const response = await request(app)
        .post(`/api/discussion/comments/${commentResult.lastID}/upvote`)
        .send({ user_id: testUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.vote_count).toBe(1);
      expect(response.body.hasVoted).toBe(true);

      // Verify SSE broadcast
      expect(sseService.broadcast).toHaveBeenCalledWith(
        testContextId,
        expect.objectContaining({
          type: 'comment_vote_updated',
          comment_id: commentResult.lastID,
          vote_count: 1
        })
      );
    });

    test('should toggle off upvote if already voted', async () => {
      // Create a comment
      const commentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Test comment']
      );

      // Add vote
      await runQuery(
        'INSERT INTO discussion_comment_votes (comment_id, user_id) VALUES (?, ?)',
        [commentResult.lastID, testUserId]
      );

      const response = await request(app)
        .post(`/api/discussion/comments/${commentResult.lastID}/upvote`)
        .send({ user_id: testUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.vote_count).toBe(0);
      expect(response.body.hasVoted).toBe(false);
    });

    test('should reject upvote without user_id', async () => {
      const commentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Test comment']
      );

      const response = await request(app)
        .post(`/api/discussion/comments/${commentResult.lastID}/upvote`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('user_id is required');
    });

    test('should reject upvote for non-existent comment', async () => {
      const response = await request(app)
        .post('/api/discussion/comments/99999/upvote')
        .send({ user_id: testUserId })
        .expect(404);

      expect(response.body.error).toContain('Comment not found');
    });
  });

  describe('DELETE /api/discussion/comments/:id', () => {
    test('should delete a comment by its creator', async () => {
      // Create a comment
      const commentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Test comment']
      );

      const response = await request(app)
        .delete(`/api/discussion/comments/${commentResult.lastID}`)
        .send({ user_id: testUserId })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify comment is deleted
      const comment = await getQuery(
        'SELECT * FROM discussion_comments WHERE id = ?',
        [commentResult.lastID]
      );
      expect(comment).toBeUndefined();

      // Verify SSE broadcast
      expect(sseService.broadcast).toHaveBeenCalledWith(
        testContextId,
        expect.objectContaining({
          type: 'comment_deleted',
          comment_id: commentResult.lastID
        })
      );
    });

    test('should reject deletion by non-creator', async () => {
      // Create a comment
      const commentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Test comment']
      );

      const response = await request(app)
        .delete(`/api/discussion/comments/${commentResult.lastID}`)
        .send({ user_id: 'different-user' })
        .expect(403);

      expect(response.body.error).toContain('Only the comment creator can delete');
    });

    test('should reject deletion without user_id', async () => {
      const commentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Test comment']
      );

      const response = await request(app)
        .delete(`/api/discussion/comments/${commentResult.lastID}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('user_id is required');
    });

    test('should cascade delete replies and votes', async () => {
      // Create parent comment
      const parentResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, user_id, comment_text) VALUES (?, ?, ?, ?)',
        [testContextId, 'campaign', testUserId, 'Parent comment']
      );

      // Create reply
      const replyResult = await runQuery(
        'INSERT INTO discussion_comments (context_id, context_type, parent_id, user_id, comment_text) VALUES (?, ?, ?, ?, ?)',
        [testContextId, 'campaign', parentResult.lastID, testUserId, 'Reply comment']
      );

      // Add vote to parent
      await runQuery(
        'INSERT INTO discussion_comment_votes (comment_id, user_id) VALUES (?, ?)',
        [parentResult.lastID, testUserId]
      );

      // Delete parent
      await request(app)
        .delete(`/api/discussion/comments/${parentResult.lastID}`)
        .send({ user_id: testUserId })
        .expect(200);

      // Verify reply is deleted (CASCADE) - check that it doesn't exist
      const reply = await getQuery(
        'SELECT * FROM discussion_comments WHERE id = ?',
        [replyResult.lastID]
      );
      expect(reply).toBeUndefined();

      // Verify vote is deleted (CASCADE)
      const vote = await getQuery(
        'SELECT * FROM discussion_comment_votes WHERE comment_id = ?',
        [parentResult.lastID]
      );
      expect(vote).toBeUndefined();
    });
  });
});
