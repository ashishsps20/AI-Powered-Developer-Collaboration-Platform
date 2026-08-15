const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    data: {
      service: 'developer-platform-api',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

module.exports = router;
