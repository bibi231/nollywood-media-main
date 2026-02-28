const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

// Create a token for a random attacker user
const secret = process.env.JWT_SECRET || 'naijamation-dev-secret-change-in-production';
const attackerToken = jwt.sign({
    userId: '11111111-2222-3333-4444-555555555555', // Fake attacker UUID
    email: 'attacker@example.com',
    role: 'user'
}, secret, { expiresIn: '1h' });

// Try to delete a comment belonging to another user.
const bodyData = JSON.stringify({
    table: 'film_comments',
    operation: 'delete',
    filters: [
        { column: 'id', op: 'eq', value: '3704705b-296e-4cc6-bf5b-439587428800' } // ID from previous queries
    ]
});

const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/api/query',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${attackerToken}`
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('BOLA Test - Status:', res.statusCode, 'Response:', data));
});

req.on('error', (e) => console.error(e));
req.write(bodyData);
req.end();
