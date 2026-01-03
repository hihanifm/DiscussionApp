-- Discussion comments table (context-level, e.g., campaign, post, article)
CREATE TABLE IF NOT EXISTS discussion_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    context_id TEXT NOT NULL,
    context_type TEXT DEFAULT 'campaign',
    parent_id INTEGER,
    user_id TEXT,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (parent_id) REFERENCES discussion_comments(id) ON DELETE CASCADE
);

-- Comment votes (thumbs-up only)
CREATE TABLE IF NOT EXISTS discussion_comment_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES discussion_comments(id) ON DELETE CASCADE,
    UNIQUE(comment_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_context ON discussion_comments(context_id, context_type);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON discussion_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_votes_comment ON discussion_comment_votes(comment_id);
