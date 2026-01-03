const express = require('express');
const router = express.Router();
const sseService = require('../services/sseService');

// GET /api/sse/discussion/:contextId - SSE endpoint for real-time updates
router.get('/discussion/:contextId', (req, res) => {
  const { contextId } = req.params;
  sseService.subscribe(contextId, res);
});

module.exports = router;
