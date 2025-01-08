/**
 * users.js
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 * and the suggested pattern for retrieving data by executing queries
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library
* 
 */

const express = require("express");
const router = express.Router();

/**
 * @desc Display all the users
 */

router.get("/main", (req, res) => {
    res.render("main.ejs");
});

router.get("/admin-settings", (req, res) => {
    res.render("admin-settings.ejs")
});

router.get("/login", (req, res) => {
    res.render("login.ejs")
});

//Use .get() method to retrieve page
router.get("/admin-home", (req, res) => {
    res.render("admin-home.ejs", {url:req.protocol+"://"+req.headers.host});
});

//Use .post() method to apply queries
// router.post();
router.get('/admin-home-dt', (req, res) => {
    const draftNotes = [
        { id: 1, title: 'Draft 1', subtitle: 'Subtitle 1', created: '2025-01-01', modified: '2025-01-02' },
        { id: 2, title: 'Draft 2', subtitle: 'Subtitle 2', created: '2025-01-03', modified: '2025-01-04' },
    ];

    const publishedNotes = [
        { id: 1, title: 'Note 1', subtitle: 'Subtitle 1', created: '2025-01-01', published: '2025-01-02', likes: 10, comments: 5 },
        { id: 2, title: 'Note 2', subtitle: 'Subtitle 2', created: '2025-01-03', published: '2025-01-04', likes: 20, comments: 15 },
    ];

    res.render("admin-home.ejs", { draftNotes, publishedNotes });
});


router.get("/admin-edit-product", (req, res) => {
    res.render("admin-edit-product.ejs");
});

// router.post();

router.get("/list-users", (req, res, next) => {
    // Define the query
    query = "SELECT * FROM users"

    // Execute the query and render the page with the results
    global.db.all(query, 
        function (err, rows) {
            if (err) {
                next(err); //send the error on to the error handler
            } else {
                res.json(rows); // render page as simple json
            }
        }
    );
});

/**
 * @desc Displays a page with a form for creating a user record
 */
router.get("/add-user", (req, res) => {
    res.render("add-user.ejs");
});

/**
 * @desc Add a new user to the database based on data from the submitted form
 */
router.post("/add-user", (req, res, next) => {
    // Define the query
    query = "INSERT INTO users (user_name) VALUES( ? );"
    query_parameters = [req.body.user_name]
    
    // Execute the query and send a confirmation message
    global.db.run(query, query_parameters,
        function (err) {
            if (err) {
                next(err); //send the error on to the error handler
            } else {
                res.send(`New data inserted @ id ${this.lastID}!`);
                next();
            }
        }
    );
});

router.get("/users-login", (req, res) => {
    res.render("users-login.ejs");
});

router.post("/users-login", (req, res) => {
    const { username, password } = req.body;
// Handle login logic (authentication, validation, etc.)
    res.redirect("/dashboard");
});

router.get("/admin-ticket/:id", (req, res) => {
    const ticket = {
        createdDate: '2025-01-01',
        lastModified: '2025-01-05',
        status: 'Draft',
        title: 'Event Title',
        subtitle: 'Event Subtitle',
        fullPriceCount: 50,
        fullPrice: 20,
        concessionPriceCount: 20,
        concessionPrice: 15,
      };
      res.render('admin-edit-product.ejs', { ticket });
});

router.post("/admin/ticket/update", (req, res) => {
    const updatedTicket = req.body;

    // Logic to update the ticket in the database
    console.log('Updated Ticket:', updatedTicket);
  
    // Redirect to an EJS page (e.g., confirmation or dashboard)
    res.render('confirmation', { ticket: updatedTicket });
});

// Export the router object so index.js can access it
module.exports = router;
