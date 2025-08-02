/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser and EJS
const express = require("express");
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'library-booking-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/users/sign-in');
    }
}

// Admin authentication middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).send('Access denied. Admin privileges required.');
    }
}

// Make auth middleware available globally
app.locals.requireAuth = requireAuth;
app.locals.requireAdmin = requireAdmin;

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db',function(err){
    if(err){
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
    }
});

// Handle requests to the home page 
app.get('/', (req, res) => {
    res.redirect('/events');
});

app.get('/events', (req, res) => {
    const query = `
        SELECT id, title, subtitle, published_date, count_general, count_VIP, 
               full_price, concession_price,
               CASE 
                   WHEN (count_general + count_VIP) > 0 THEN 'available'
                   ELSE 'sold_out'
               END as availability_status
        FROM ticket 
        WHERE published_date IS NOT NULL
        ORDER BY published_date DESC
    `;
    
    global.db.all(query, (err, tickets) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).send("Error fetching events.");
        } else {
            res.render('home.ejs', { 
                tickets: tickets || [],
                user: req.session.user || null
            });
        }
    });
});

// Legacy route for admin credentials (keep for admin access)
app.get('/admin-info', (req, res) => {
    const queryUser = "SELECT user_name, password FROM users WHERE role = 'admin' LIMIT 1";

    global.db.get(queryUser, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).send("Error fetching user data.");
        } else {
            const credentials = result ? 
                { username: result.user_name, password: result.password } : 
                { username: 'admin', password: 'admin123' };

            res.render('main.ejs', { 
                credentials,
                user: req.session.user || null
            });
        }
    });
});

// About page route
app.get('/about', (req, res) => {
    res.render('about', {
        user: req.session.user || null
    });
});

// Contact page route
app.get('/contact', (req, res) => {
    res.render('contact', {
        user: req.session.user || null
    });
});

// Contact form submission
app.post('/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    
    // In a real application, you would:
    // 1. Validate the input
    // 2. Send an email or save to database
    // 3. Send confirmation email to user
    
    console.log('Contact form submission:', { name, email, subject, message });
    
    res.render('contact', {
        user: req.session.user || null,
        success: 'Thank you for your message! We will get back to you within 24 hours.'
    });
});

// Add route handlers
const usersRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

app.use('/users', usersRoutes);
app.use('/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).render('error', { 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { message: 'Page not found' });
});


// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})