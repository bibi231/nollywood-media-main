const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('ts-node').register({
    transpileOnly: true,
    compilerOptions: { module: 'commonjs' }
});

const app = express();
app.use(cors());
app.use(express.json());

// Mocking Vercel Request/Response for our API handlers
const createVercelReqRes = (req, res) => {
    return {
        req: {
            ...req,
            query: req.query,
            body: req.body,
            method: req.method,
            headers: req.headers,
        },
        res: {
            status: (code) => {
                res.status(code);
                return {
                    json: (data) => res.json(data),
                    end: () => res.end(),
                };
            },
            setHeader: (key, value) => res.setHeader(key, value),
        }
    };
};

// Route wrapper
const serveApi = async (req, res, pathStr) => {
    try {
        const modulePath = path.join(__dirname, 'api', pathStr);
        if (fs.existsSync(modulePath + '.ts') || fs.existsSync(modulePath + '.js')) {
            const ext = fs.existsSync(modulePath + '.ts') ? '.ts' : '.js';
            const handler = require(modulePath + ext);
            const { req: vReq, res: vRes } = createVercelReqRes(req, res);
            await handler.default(vReq, vRes);
        } else {
            console.warn('API route not found:', modulePath);
            res.status(404).json({ error: 'Route not found locally' });
        }
    } catch (err) {
        console.error('Error serving local API:', err);
        res.status(500).json({ error: err.message });
    }
};

app.all('/api/query', async (req, res, next) => {
    try { await serveApi(req, res, 'query'); } catch (err) { next(err); }
});

app.all('/api/auth/:action', async (req, res, next) => {
    try { await serveApi(req, res, `auth/${req.params.action}`); } catch (err) { next(err); }
});

app.all('/api/films/:action', async (req, res, next) => {
    try { await serveApi(req, res, `films/${req.params.action}`); } catch (err) { next(err); }
});

app.use('/api', (req, res) => {
    console.log(`Unmapped API call: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Endpoint not mapped in local-server.js' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local API Proxy Server running on http://localhost:${PORT}`);
});
