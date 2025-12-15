// Loads the environment variables

require('dotenv').config();

const port = process.env.PORT || 3000;

let bearerTokens = new Set();

if (process.env.BEARER_TOKENS) {
    bearerTokens = new Set(
        process.env.BEARER_TOKENS.split(',').map(t => t.trim()).filter(Boolean)
    );
} else if (process.env.BEARER_TOKEN) {
    bearerTokens = new Set([process.env.BEARER_TOKEN]);
}


module.exports = {
    port,
    bearerTokens,
};
