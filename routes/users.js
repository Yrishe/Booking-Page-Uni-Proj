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
const auth  = require("../index"); //import authentication func
// const session = require("express-session");

// app.use(session({
//     secret: 'secret-key', //used to sign the session ID cookie
//     resave: false, //don't save unmodified session
//     saveUninitialized: false, //Don't create session until new data is stored
//     cookie: { secure:false } //only true if using https
// }));

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        console.log("User authenticated");
        return next(); // User is authenticated
    } else {
        console.log("User not authenticated");
      return res.redirect('/main'); // Redirect to login
    }
}

/**
 * @desc Validate the user existence
 */

function checkCredentials(username, password, callback) {
    const query = `SELECT * FROM users WHERE user_name = ? AND password = ?`;

    db.get(query, [username, password], (err, row) => {
        if (err) {
            console.error("Error checking credentials:", err.message);
            return callback(err, null);
        }
        if (row) {
            // User found
            return callback(null, true);
        } else {
            // User not found
            return callback(null, false);
        }
    });
}


router.get("/admin-settings", (req, res) => {
    res.render("admin-settings.ejs");
});

/* User Sign In */
router.get("/sign-in", (req, res) => {
    res.render("sign-in.ejs")
});

router.post("/loggedIn", (req, res) => {
    const { username, password } = req.body;

    checkCredentials(username, password, (err, isValid) => {
        if(err) {
            return res.status(500).send("An error occurred while validating credentials.");
        }
        if (isValid) {
            console.log("Login successful!");
            res.redirect("/users/admin-home");
        } else {
            return res.status(401).send("Invalid username or password.");
        }
    });
});

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            return res.status(500).send("Error logging out.");
        }
        res.redirect("/main");
    });
});

/* User Sign Up*/
router.get("/sign-up", (req, res) => {
    res.render("sign-up.ejs");
});

// router.post("/sign-up", (req, res) => {
//     const { username, password } = req.body;
// // Handle login logic (authentication, validation, etc.)
//     res.redirect("/dashboard");
// });
/*******************/

/** 
 * @desc Admin Home Page
 * */  

// app.post('/admin-home-add', async (req, res, next) => {

// });

router.get("/admin-home", isAuthenticated, (req, res) => {

    draft_elements = "SELECT id, title, subtitle, created_at, modified_date FROM ticket WHERE publication_status = 'draft'"
    published_elements = "SELECT id, title, subtitle, created_at, modified_date, published_date FROM ticket WHERE publication_status = 'published'"

    //Execute both queries asynchronously 
    Promise.all([
        new Promise((resolve, reject) => {
            global.db.all(draft_elements, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }),
        new Promise((resolve, reject) => {
            global.db.all(published_elements, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result)
                }
            })
        })
    ])
    .then(([draft_results, published_results]) => {
        //Process the results to structure the values
        const draft = draft_results.map(item => ({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            created: item.created_at,
            modified: item.modified_date
        }));

        const published = published_results.map(item => ({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            created: item.created_at,
            published: item.published_date
        }));

        res.render("admin-home.ejs", { draft, published }, { user: req.session.user });
    })
    .catch((err) => {
        console.error(err);
        res.redirect("/");
    });
});


/** 
 * @desc Admin Edit Page
 * */  

router.get("/admin-edit-product/:id", (req, res) => {
    // SQL query to fetch draft tickets by ID
    const draft_elements = "SELECT id, title, subtitle, count_general, count_VIP, full_price, concession_price, created_at, modified_date, publication_status FROM ticket WHERE id = ?";
    const ticketId = req.params.id; // Retrieve the ID from the URL parameters

    global.db.get(draft_elements, [ticketId], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error fetching ticket data.");
        } else if (!result) {
            res.status(404).send("Ticket not found.");
        } else {
            // Map the result to create a ticket structure for the template
            const ticket = {
                id: result.id,
                createdDate: result.created_at,
                lastModified: result.modified_date,
                status: result.publication_status,
                title: result.title,
                subtitle: result.subtitle,
                count_general: result.count_general,
                count_VIP: result.count_VIP,
                full_price: result.full_price, 
                concession_price: result.concession_price,
            };

            // Render the admin-edit-product.ejs template with the ticket data
            res.render('admin-edit-product.ejs', { ticket });
            console.log('Moving to admin edit product page.');
        }
    });
});

router.post("/admin-edit-product/:id", (req, res, next) => {
    const ticketId = req.params.id;
    let {title, subtitle, count_general, count_VIP, full_price, concession_price} = req.body;

    console.log("Receiving data:", req.body);

    // Map the request body keys to the database columns
    let elements = { title, subtitle, count_general, count_VIP, full_price, concession_price };
    console.log("Elements: ", elements);

    let updateFields = []
    let updateValues = []

    // Iterate over the elements to construct dynamic fields
    for (const [key, value] of Object.entries(elements)) {
        console.log("values going to query: ", value);
        if (value !== undefined && value !== null && value !== '') {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
        }
    }

    if(updateValues.length === 0) return res.status(400).send("No fields provided to update");

    updateValues.push(ticketId)

    let updateTicket = `UPDATE ticket SET ${updateFields.join(", ")} WHERE id = ?`;
    
    console.log("Update fields:", updateValues);
    console.log("Query:", updateTicket);
    console.log("Values:", updateValues);
    console.log("Completing query");

    // Execute the query and send a confirmation message
    global.db.run(updateTicket, updateValues,
        function (err) {
            if (err) {
                next(err); //send the error on to the error handler
            } else {
                console.log(`Data updated @ id ${ticketId}!`);
                res.redirect("/users/admin-home");
            }
        }
    );
});

router.post("/admin-home", async (req, res, next) => {
    let { action, ticketId, title, subtitle, count_general, count_VIP, full_price, concession_price } = req.body;
    console.log("action: ", action);
    console.log(ticketId);

    if (action === "publish") {
        // Selected ticket IDs
        let selectedTickets = req.body.selectedTickets;

        if (!selectedTickets || selectedTickets.length == 0) {
            return res.status(404).send("No tickets selected.");
        }

        if (!Array.isArray(selectedTickets)) {
            // If only one checkbox is ticked, it's a string; convert it to an array
            selectedTickets = [selectedTickets];
        }

        console.log("Selected Tickets:", selectedTickets);

        // Prepare the SQL query
        const updateQuery = `UPDATE ticket SET published_date = CURRENT_TIMESTAMP, publication_status = ? WHERE id IN (${selectedTickets.map(() => '?').join(', ')})`;
        let params = ['published', ...selectedTickets];
        console.log(params);

        global.db.run(updateQuery, params, (err) => {
            if (err) {
                console.error(err);
                return next(err);
            }
            console.log(`Published tickets: ${selectedTickets.join(", ")}`);
            res.redirect("/users/admin-home");
        });
    } else if (action === "add") {

        // Correctly declare insertQuery
        let insertQuery = 'INSERT INTO ticket (title, subtitle, count_general, count_VIP, full_price, concession_price) VALUES (?, ?, ?, ?, ?, ?)';

        // Insert the new ticket into the database
        global.db.run(insertQuery, [title, subtitle, count_general, count_VIP, full_price, concession_price], (err) => {
            if (err) {
                console.error(err);
                return next(err);  // Return error to next middleware
            }
            // Redirect back to the admin-home page to reload the tickets
            res.redirect('/users/admin-home');
        });
    } else if(action === "delete"){
        console.log("delete condition")
        if(!ticketId) return res.status(400).send("Ticket ID is missing.")

        let deleteQuery = 'DELETE FROM ticket WHERE id = ?'
        global.db.run(deleteQuery, [ticketId], (err) => {
            if(err) {
                console.error(err);
                return next(err);
            }
            res.redirect("/users/admin-home");
        });
    } else {
        // Handle case where no action is provided or action is invalid
        return res.status(400).send("Invalid action.");
    }
});

// router.post("/users/delete-ticket/:id", (req, res, next) => {
//     const ticketId = req.params.id;
//     const deleteQuery = 'DELETE FROM ticket WHERE id = ?'
//     global.db.run(deleteQuery, [ticketId], (err) => {
//         if(err) {
//             console.error('Error deleting ticket: ', err.message);
//             return next(err);
//         }
//         res.redirect('/users/admin-home')
//     })
// });

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

// router.post("/admin/ticket/update", (req, res) => {
//     const updatedTicket = req.body;

//     // Logic to update the ticket in the database
//     console.log('Updated Ticket:', updatedTicket);
  
//     // Redirect to an EJS page (e.g., confirmation or dashboard)
//     res.render('confirmation', { ticket: updatedTicket });
// });

// Export the router object so index.js can access it
module.exports = router;
