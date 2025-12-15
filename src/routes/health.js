// "/health route"

const express = require('express');

const router = express.Router();


// GET /health
router.get('/', (req, res) => {
    res.status(200).json({
        code: res.statusCode,
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});


module.exports = router;