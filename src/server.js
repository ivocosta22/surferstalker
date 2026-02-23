/**
 * server.js
 *
 * Minimal HTTP server used as a keepalive/health check endpoint.
 * 
 */
const express = require('express')
const { server } = require('./config/env')
const { logColor } = require('./utils/logger')

function createServer() {
    const app = express()

    // Health check endpoints
    app.get('/', (req, res) => {
        res.status(200).send('OK')
    })

    // Fallback
    app.all('*', (req, res) => {
        res.status(404).send('Not Found')
    })

    return app
}

/**
 * Starts the HTTP server.
 * @returns {import('http').Server} Node HTTP server instance
 */
function keepAlive() {
    const PORT = Number(process.env.PORT) || server.port || 3000
    const app = createServer()

    const httpServer = app.listen(PORT, () => {
        logColor('green',`[SYSTEM] ✅ Server is now running on port ${PORT}`)
    })

    httpServer.on('error', (err) => {
    logColor('red', `[SYSTEM] ❌ Server failed to start: ${err?.message || err}`)
    })

    return httpServer
}

module.exports = keepAlive