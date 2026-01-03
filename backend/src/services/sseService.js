// SSE Service for real-time updates
class SSEService {
  constructor() {
    this.clients = new Map(); // Map of contextId -> Set of response objects
  }

  // Subscribe a client to updates for a specific context
  subscribe(contextId, res) {
    if (!this.clients.has(contextId)) {
      this.clients.set(contextId, new Set());
    }
    
    this.clients.get(contextId).add(res);
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Handle client disconnect
    res.on('close', () => {
      this.unsubscribe(contextId, res);
    });
  }

  // Unsubscribe a client
  unsubscribe(contextId, res) {
    if (this.clients.has(contextId)) {
      this.clients.get(contextId).delete(res);
      if (this.clients.get(contextId).size === 0) {
        this.clients.delete(contextId);
      }
    }
  }

  // Broadcast an event to all clients subscribed to a context
  broadcast(contextId, event) {
    if (!this.clients.has(contextId)) {
      return;
    }

    const message = `data: ${JSON.stringify(event)}\n\n`;
    const clients = this.clients.get(contextId);
    
    // Send to all clients and remove dead connections
    const deadClients = [];
    clients.forEach(res => {
      try {
        res.write(message);
      } catch (err) {
        console.error('Error sending SSE message:', err);
        deadClients.push(res);
      }
    });

    // Clean up dead connections
    deadClients.forEach(res => {
      this.unsubscribe(contextId, res);
    });
  }
}

// Singleton instance
const sseService = new SSEService();

module.exports = sseService;
