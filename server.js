const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the "views" folder
app.use(express.static(path.join(__dirname, 'views')));

// Extract user name and email from Easy Auth headers
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

// Unauthenticated landing page
app.get('/', (req, res) => {
  const userInfo = getUserInfo(req);
  if (userInfo) {
    return res.redirect('/profile');
  }
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// Authenticated profile page
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

// Optional: view all claims for debugging
app.get('/debug', (req, res) => {
  const encoded = req.headers['x-ms-client-principal'];
  if (!encoded) return res.send("No identity info");

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const clientPrincipal = JSON.parse(decoded);

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(clientPrincipal, null, 2));
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
