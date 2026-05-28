const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the project directory
app.use(express.static('.'));

// Route for the main game page
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Start the server
app.listen(port, () => {
    console.log(`TIE Fighter game running at http://localhost:${port}/`);
    console.log('Press Ctrl+C to stop the server');
});
