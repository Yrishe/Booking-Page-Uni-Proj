
const express = require("express");
// const { route } = require("./products");
const router = express.Router();

// router.post();

router.get("/customer-checkout/:id", (req, res) => {

    let eventQuery = "SELECT title, subtitle, count_general, count_VIP, full_price, concession_price, published_date, availability_status FROM ticket WHERE id = ?";
    
    global.db.get(eventQuery, [req.params.id], (err, result) => {
      if(err) {
        return res.status(500).send("Error fetching data")
      }
      if(!result) {
        return res.status(404).send("Ticket not found");
      }
      console.log(result);
      let event = {
        title: result.title,
        subtitle: result.subtitle,
        published_date: result.published_date,
        availability_status: result.availability_status,
        count_general: result.count_general,
        count_VIP: result.count_VIP,
        ticketTypes: [
          { id: result.id, name: 'General Ticket', price: result.full_price },
          { id: result.id, name: 'VIP Ticket', price: result.concession_price }
        ],
        maxTicketsPerPerson: 5
      };
      console.log(`${event.title}`);
      // console.log(`Title: {result.title}, Subtitle: {result.subtitle}, published_date: {result.published_date}, availability_status: {result.availability_status},
      //   count_general: {result.count_general}, count_VIP: {result.count_VIP}, ticketTypes: {ticketTypes[0]}, {ticketTypes[1]}, maxTicketsPerPerson: {maxTicketsPerPerson}`)
      res.render("customer-checkout.ejs", { event });
    });
 
});

router.post("/customer-checkout", async (req, res) => {
    const userName = req.body.userName;  // Get the name from the input field
    let {ticket_id, user_id, ticket_type, quantity, total_price} = req.body;
    console.log(user_id);

    try {
      // Check ticket availability
      const ticket = await db.get(
        `SELECT * FROM ticket WHERE id = ?`,
        [ticket_id]
      );
  
      if (!ticket) {
        throw new Error('Ticket not found');
      }
  
      if (ticket_type === 'general' && ticket.count_general < quantity) {
        throw new Error('Not enough general tickets available');
      }
  
      if (ticket_type === 'VIP' && ticket.count_VIP < quantity) {
        throw new Error('Not enough VIP tickets available');
      }
  
      // Calculate total price
      const price = ticket_type === 'general' ? ticket.full_price : ticket.concession_price;
      const total_price = price * quantity;
  
      // Insert into booked_tickets
      await db.run(
        `INSERT INTO booked_tickets (ticket_id, user_id, ticket_type, quantity, total_price) VALUES (?, ?, ?, ?, ?)`,
        [ticket_id, user_id, ticket_type, quantity, total_price]
      );
  
      // Update ticket availability
      const columnToUpdate = ticket_type === 'general' ? 'count_general' : 'count_VIP';
      await db.run(
        `UPDATE ticket SET ${columnToUpdate} = ${columnToUpdate} - ? WHERE id = ?`,
        [quantity, ticket_id]
      );
  
      // Commit transaction
      // await db.run('COMMIT');
      // res.send('Booking successful!');
      res.redirect('/products/basket')
    } catch (err) {
      // Rollback transaction in case of error
      await db.run('ROLLBACK');
      res.status(500).send(err.message);
    }
});

router.get("/customer-sales-page-d", (req, res) => {
    let queryPublished = "SELECT * FROM ticket WHERE publication_status = 'published'"
    global.db.all(queryPublished, (err, result) => {
      if(err) {
        console.error(err);
        return res.status(500).send("Error fetching data")
      }
      let events = result.map(event => ({
        name: event.title,
        id: event.id,
        generalPrice: event.full_price,
        vipPrice: event.concession_price,
        availability: event.availability_status 
        // url: `event-${event.id}`
      }));
      res.render('customer-sales-page.ejs', { events });
    });
});

router.get("/bookings", async (req, res) => {
  const userId = req.params.userId;
  console.log("UserId :", userId);
  const query = `
    SELECT 
      b.id AS booking_id,
      t.title AS ticket_title,
      t.subtitle AS ticket_subtitle,
      b.ticket_type,
      b.quantity,
      b.total_price,
      b.booking_date,
      u.user_name
    FROM 
      booked_tickets b
    JOIN 
      ticket t ON b.ticket_id = t.id
    JOIN 
      users u ON b.user_id = u.id
    WHERE 
      b.user_id = ?`;

  try {
    const bookings = await new Promise((resolve, reject) => {
      db.all(query, [userId], (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          reject(err);
        } else {
          console.log("Query result (rows):", rows);
          resolve(rows);
        }
      });
    });

    console.log("Bookings:", bookings);

    if (!Array.isArray(bookings)) {
      console.error("Unexpected result type:", typeof bookings);
      return res.status(500).send("Unexpected data format.");
    }

    res.render("basket.ejs", { bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).send("Error fetching bookings");
  }
});

// Route to handle form submission and check name
router.post("/check-name", async (req, res) => {
  const userName = req.body.userName;  // Get the name from the input field

  if (!userName) {
    return res.status(400).send("Name is required.");
  }

  // Query the database to check if the name exists
  const query = `SELECT * FROM users WHERE user_name = ?`;

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(query, [userName], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (user) {
      // If the user is found, proceed with checkout or other logic
      res.send(`Welcome, ${user.user_name}! Proceeding with checkout.`);
    } else {
      // If the user is not found
      res.status(404).send("User not found in the database.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error checking user name.");
  }
});



module.exports = router;
