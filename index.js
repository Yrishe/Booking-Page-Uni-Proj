/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser and EJS
const express = require('express');
const app = express();
const path = require("path");
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // set the app to use ejs for rendering

//Default
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(express.static(__dirname + '/public')); // set location of static files

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
app.get('/main', (req, res) => {

    queryUser = "SELECT user_name, password FROM users WHERE role = 'admin'";

    const userId = req.params.id; // Retrieve the ID from the URL parameters

    global.db.get(queryUser, [userId], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error fetching user data.");
        } else if (!result) {
            res.status(404).send("User not found.");
        } else {
            // Map the result to create a ticket structure for the template
            const credentials = { username: result.user_name, password: result.password };

            // Render the admin-edit-product.ejs template with the ticket data
            res.render('main.ejs', { credentials });
            console.log('Credential Fetched');
        }
    });
});

// Add all the route handlers in usersRoutes to the app under the path /users
const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);

// Add all the route handlers in usersRoutes to the app under the path /users
const productRoutes = require('./routes/products');
app.use('/products', productRoutes);


// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

