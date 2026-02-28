const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

const secret = process.env.JWT_SECRET || 'naijamation-dev-secret-change-in-production';
const token = jwt.sign({
    userId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    email: 'testuser9@example.com',
    role: 'user'
}, secret, { expiresIn: '1h' });

const bodyData = JSON.stringify({
    table: 'film_comments',
    operation: 'insert',
    data: {
        film_id: '30caeef4-03d9-433e-aa26-c605087bef3a',
        user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        content: 'Test comment from API script'
    }
});

const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/api/query',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('Status:', res.statusCode, 'Response:', data));
});

req.on('error', (e) => console.error(e));
req.write(bodyData);
req.end();
