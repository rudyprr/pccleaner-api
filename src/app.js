// Configures the application (routes, middlewares, handlers)

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');

const bearerAuth = require('./middleware/auth');
const healthRouter = require('./routes/health');
const clean_tempRouter = require('./routes/temp');
const clean_binRouter = require('./routes/bin');
const clean_clipboardRouter = require('./routes/clipboard');
const clean_startMenuShortcutsRouter = require('./routes/start-menu-shortcuts');
const clean_folderRouter = require('./routes/specific-files');


const app = express();

// Global Middlewares
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/health', bearerAuth(false), healthRouter); 
app.use('/clean/temp', bearerAuth(true), clean_tempRouter); 
app.use('/clean/bin', bearerAuth(true), clean_binRouter);
app.use('/clean/clipboard', bearerAuth(true), clean_clipboardRouter);
app.use('/clean/start-menu-shortcuts', bearerAuth(true), clean_startMenuShortcutsRouter);
app.use('/clean/specific-files', bearerAuth(true), clean_folderRouter);


// 404 handler
app.use((req, res, next) => { 
    res.status(404).json({
        code: res.statusCode,
        error: 'Route non trouvée'
    });
});

// Error handler
app.use((err, req, res, next) => { 
    console.error(err.stack);
    res.status(500).json({
        code: res.statusCode,
        error: 'Erreur interne du serveur'
    });
});

module.exports = app;
