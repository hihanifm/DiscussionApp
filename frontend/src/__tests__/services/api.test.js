/**
 * Tests for API service
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { api } from '../../services/api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getComments', () => {
    test('should fetch comments successfully', async () => {
      const mockComments = [
        { id: 1, comment_text: 'Comment 1', vote_count: 5 },
        { id: 2, comment_text: 'Comment 2', vote_count: 3 }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments
      });

      const result = await api.getComments('context-123', 'campaign');
      expect(result).toEqual(mockComments);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/discussion/context-123/comments?context_type=campaign'));
    });

    test('should throw error on failed request', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(api.getComments('context-123')).rejects.toThrow('Failed to fetch comments');
    });
  });

  describe('createComment', () => {
    test('should create comment with correct data', async () => {
      const newComment = {
        id: 1,
        comment_text: 'New comment',
        context_id: 'context-123',
        user_id: 'user123',
        vote_count: 0
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newComment
      });

      const result = await api.createComment('context-123', 'New comment', null, 'campaign', 'user123');
      expect(result).toEqual(newComment);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/discussion/context-123/comments'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            comment_text: 'New comment',
            parent_id: null,
            user_id: 'user123',
            context_type: 'campaign'
          })
        })
      );
    });

    test('should create reply with parent_id', async () => {
      const reply = {
        id: 2,
        comment_text: 'Reply',
        parent_id: 1,
        context_id: 'context-123'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => reply
      });

      const result = await api.createComment('context-123', 'Reply', 1, 'campaign', 'user123');
      expect(result).toEqual(reply);
      expect(JSON.parse(fetch.mock.calls[0][1].body)).toHaveProperty('parent_id', 1);
    });

    test('should throw error with message from server', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Comment text is required' })
      });

      await expect(api.createComment('context-123', '', null, 'campaign', 'user123'))
        .rejects.toThrow('Comment text is required');
    });
  });

  describe('upvoteComment', () => {
    test('should upvote comment with user_id', async () => {
      const mockResponse = {
        success: true,
        vote_count: 5,
        hasVoted: true
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.upvoteComment(1, 'user123');
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/discussion/comments/1/upvote'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ user_id: 'user123' })
        })
      );
    });

    test('should throw error on failed upvote', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Comment not found' })
      });

      await expect(api.upvoteComment(999, 'user123'))
        .rejects.toThrow('Comment not found');
    });
  });

  describe('deleteComment', () => {
    test('should delete comment with user_id', async () => {
      const mockResponse = {
        success: true,
        message: 'Comment deleted successfully'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.deleteComment(1, 'user123');
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/discussion/comments/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ user_id: 'user123' })
        })
      );
    });

    test('should throw error on failed deletion', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Only the comment creator can delete this comment' })
      });

      await expect(api.deleteComment(1, 'wrong-user'))
        .rejects.toThrow('Only the comment creator can delete this comment');
    });
  });
});
