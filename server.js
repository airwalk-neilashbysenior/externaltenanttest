const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files in /views as HTML pages
app.use(express.static(path.join(__dirname, 'views')));

// Helper to fetch Easy Auth user info
async function getUserInfo(req) {
  const authHeader = req.headers['x-ms-token-aad-id-token'];
  if (!authHeader) return null;

  try {
    const res = await fetch(`${req.protocol}://${req.get('host')}/.auth/me`, {
      headers: {
        'X-ZUMO-AUTH': req.headers['x-zumo-auth']
      }
    });

    const data = await res.json();
    return data[0]?.user_claims?.find(c => c.typ === 'name')?.val || 'Unknown';
  } catch {
    return null;
  }
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
app.get('/profile', async (req, res) => {
  const userName = await getUserInfo(req);

  if (!userName) {
    return res.redirect('/');
  }

  res.send(`
    <html>
      <body>
        <h1>You are logged in as <strong>${userName}</strong></h1>
        <a href="/.auth/logout">Sign out</a>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
