const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

// Create a test app
const app = express();

// Session configuration
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Connect to database
const db = new sqlite3.Database('./database.db');
global.db = db;

// Test route to simulate login
app.get('/test-login', (req, res) => {
    req.session.user = { id: 2, username: 'visitor', role: 'visitor' };
    res.json({ message: 'Logged in as visitor', session: req.session.user });
});

// Import and test cart route
const productRoutes = require('./routes/products');
app.use('/products', productRoutes);

// Start test server
const port = 3001;
app.listen(port, () => {
    console.log(`Test server running on port ${port}`);
    console.log('Visit http://localhost:3001/test-login to login');
    console.log('Then visit http://localhost:3001/products/cart to test cart');
});