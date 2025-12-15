#!/usr/bin/env node

const http = require('http'); 
const app = require('./app');
const config = require('./config');

const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}\n`);
});
