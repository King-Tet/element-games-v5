// server.js
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const https = require('https');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Replace with your actual local IP address and the filenames from mkcert
const httpsOptions = {
  key: fs.readFileSync('./192.168.86.40+1-key.pem'),
  cert: fs.readFileSync('./192.168.86.40+1.pem'),
};

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
    // You can also add your local IP here for convenience
    console.log('> Also ready on https://192.168.86.55:3000');
  });

  // Create an HTTPS server
  https.createServer(httpsOptions, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    })
    .listen(3001, (err) => {
      if (err) throw err;
      console.log('> HTTPS Ready on https://localhost:3001');
      console.log('> HTTPS Also ready on https://192.168.86.55:3001');
    });
});