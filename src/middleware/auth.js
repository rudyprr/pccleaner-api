// Checks if the HTTP request contains a Bearer token in the "Authorization" header.

const config = require('../config');

function bearerAuth(required = false) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!config.bearerTokens || config.bearerTokens.size === 0) { 
      return res.status(503).json({
        code: res.statusCode,
        error: 'Token non configuré'
      });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) { 
      if (required) {
        return res.status(401).json({
          code: res.statusCode,
          error: 'Token manquant ou mal formé'
        });
      }
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!config.bearerTokens.has(token)) {
      return res.status(401).json({
        code: res.statusCode,
        error: 'Token invalide'
      });
    }

    next();
  };
}

module.exports = bearerAuth;
