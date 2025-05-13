const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files in /views as HTML pages
app.use(express.static(path.join(__dirname, 'views')));

// Helper to fetch Easy Auth user info
function getUserInfo(req) {
  const encoded = req.headers['x-ms-client-principal'];
  if (!encoded) return null;

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const clientPrincipal = JSON.parse(decoded);
  const claims = clientPrincipal.claims;

  const name = claims.find(c => c.typ === 'name')?.val;
  const email = claims.find(c => c.typ === 'preferred_username')?.val
             || claims.find(c => c.typ === 'emails')?.val;

  return {
    name: name || 'Unknown',
    email: email || 'Unknown'
  };
}




// Homepage: unauthenticated users land here
app.get('/', async (req, res) => {
  const userName = await getUserInfo(req);

  if (!userName) {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
  } else {
    res.redirect('/profile');
  }
});

// Authenticated user page
app.get('/profile', (req, res) => {
  const userInfo = getUserInfo(req);

  if (!userInfo) {
    return res.redirect('/');
  }

  res.send(`
    <html>
      <body>
        <h1>You are logged in</h1>
        <p><strong>Name:</strong> ${userInfo.name}</p>
        <p><strong>Email:</strong> ${userInfo.email}</p>
        <a href="/.auth/logout">Sign out</a>
      </body>
    </html>
  `);
});

