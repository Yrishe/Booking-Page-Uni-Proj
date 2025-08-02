
const express = require("express");
const router = express.Router();
const paymentProcessor = require('../utils/paymentProcessor');

// Authentication middleware for customer routes
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/users/sign-in');
    }
}

// router.post();

router.get("/customer-checkout/:id", requireAuth, (req, res) => {
    const eventQuery = "SELECT id, title, subtitle, count_general, count_VIP, full_price, concession_price, published_date FROM ticket WHERE id = ? AND published_date IS NOT NULL";
    
    global.db.get(eventQuery, [req.params.id], (err, result) => {
        console.log('Event query for ID:', req.params.id);
        console.log('Query result:', result);
        if(err) {
            console.error('Database error:', err);
            return res.status(500).render('error', { message: "Error fetching event data" });
        }
        if(!result) {
            console.log('No event found for ID:', req.params.id);
            return res.status(404).render('error', { message: "Event not found or not available" });
        }
        
        const totalAvailable = (result.count_general || 0) + (result.count_VIP || 0);
        if(totalAvailable <= 0) {
            return res.render('error', { message: "This event is sold out" });
        }
        
        const event = {
            id: result.id,
            title: result.title,
            subtitle: result.subtitle,
            published_date: result.published_date,
            count_general: result.count_general,
            count_VIP: result.count_VIP,
            full_price: result.full_price,
            availability_status: totalAvailable > 0 ? 'available' : 'sold out',
            ticketTypes: [
                { id: 'general', name: 'General Ticket', price: result.full_price, available: result.count_general },
                { id: 'VIP', name: 'VIP Ticket', price: result.concession_price, available: result.count_VIP }
            ],
            maxTicketsPerPerson: 5
        };
        
        res.render("customer-checkout.ejs", { 
            event,
            user: req.session.user,
            error: null
        });
    });
});

router.post("/customer-checkout", requireAuth, async (req, res) => {
    const { ticket_id, ticket_type, quantity } = req.body;
    const user_id = req.session.user.id;
    
    try {
        // Validate input
        if (!ticket_id || !ticket_type || !quantity || quantity <= 0) {
            throw new Error('Invalid booking data');
        }
        
        // Check ticket availability
        const ticket = await new Promise((resolve, reject) => {
            global.db.get('SELECT * FROM ticket WHERE id = ?', [ticket_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!ticket) {
            throw new Error('Event not found');
        }
        
        if (ticket.availability_status !== 'available') {
            throw new Error('Event is not available for booking');
        }
        
        const availableCount = ticket_type === 'general' ? ticket.count_general : ticket.count_VIP;
        if (availableCount < quantity) {
            throw new Error(`Not enough ${ticket_type} tickets available. Only ${availableCount} left.`);
        }
        
        // Calculate total price
        const price = ticket_type === 'general' ? ticket.full_price : ticket.concession_price;
        const total_price = price * quantity;
        
        // Create booking record
        const bookingId = await new Promise((resolve, reject) => {
            const query = `INSERT INTO booked_tickets (ticket_id, user_id, ticket_type, quantity, total_price, booking_status) VALUES (?, ?, ?, ?, ?, 'pending')`;
            global.db.run(query, [ticket_id, user_id, ticket_type, quantity, total_price], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
        
        // Store booking info in session for cart
        req.session.pendingBooking = {
            bookingId,
            ticket_id,
            ticket_type,
            quantity,
            total_price,
            eventTitle: ticket.title
        };
        
        // Redirect to cart page
        res.redirect(`/products/cart`);
        
    } catch (err) {
        console.error('Booking error:', err);
        
        // Get event data for re-rendering the form
        global.db.get('SELECT * FROM ticket WHERE id = ?', [ticket_id], (dbErr, ticket) => {
            if (dbErr || !ticket) {
                return res.status(500).render('error', { message: 'An error occurred' });
            }
            
            const event = {
                id: ticket.id,
                title: ticket.title,
                subtitle: ticket.subtitle,
                published_date: ticket.published_date,
                availability_status: ticket.availability_status,
                count_general: ticket.count_general,
                count_VIP: ticket.count_VIP,
                ticketTypes: [
                    { id: 'general', name: 'General Ticket', price: ticket.full_price, available: ticket.count_general },
                    { id: 'VIP', name: 'VIP Ticket', price: ticket.concession_price, available: ticket.count_VIP }
                ],
                maxTicketsPerPerson: 5
            };
            
            res.render('customer-checkout', {
                event,
                user: req.session.user,
                error: err.message
            });
        });
    }
});

// Payment page route
router.get("/payment/:bookingId", requireAuth, (req, res) => {
    const bookingId = req.params.bookingId;
    
    if (!req.session.pendingBooking || req.session.pendingBooking.bookingId != bookingId) {
        return res.redirect('/products/customer-sales-page-d');
    }
    
    const booking = req.session.pendingBooking;
    res.render('payment', {
        booking,
        user: req.session.user,
        error: null
    });
});

// Process payment
router.post("/payment/:bookingId", requireAuth, async (req, res) => {
    const bookingId = req.params.bookingId;
    const { paymentMethod, cardNumber, expiryDate, cvv, billingAddress } = req.body;
    
    try {
        if (!req.session.pendingBooking || req.session.pendingBooking.bookingId != bookingId) {
            throw new Error('Invalid booking session');
        }
        
        const booking = req.session.pendingBooking;
        
        // Process payment
        const paymentData = {
            amount: booking.total_price,
            paymentMethod,
            cardNumber: cardNumber || null
        };
        
        const paymentResult = await paymentProcessor.processPayment(paymentData);
        
        // Create payment record
        const paymentId = await paymentProcessor.createPaymentRecord(bookingId, paymentData, paymentResult);
        
        // Update booking status
        await paymentProcessor.updateBookingStatus(bookingId, paymentId);
        
        // Update ticket availability
        const columnToUpdate = booking.ticket_type === 'general' ? 'count_general' : 'count_VIP';
        await new Promise((resolve, reject) => {
            const query = `UPDATE ticket SET ${columnToUpdate} = ${columnToUpdate} - ? WHERE id = ?`;
            global.db.run(query, [booking.quantity, booking.ticket_id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
        
        // Create invoice
        const invoice = await paymentProcessor.createInvoice(bookingId, booking.total_price, billingAddress);
        
        // Clear pending booking from session
        delete req.session.pendingBooking;
        
        // Redirect to confirmation page
        res.redirect(`/products/booking-confirmation/${bookingId}`);
        
    } catch (err) {
        console.error('Payment error:', err);
        
        const booking = req.session.pendingBooking;
        res.render('payment', {
            booking,
            user: req.session.user,
            error: err.message
        });
    }
});

// Booking confirmation page
router.get("/booking-confirmation/:bookingId", requireAuth, async (req, res) => {
    const bookingId = req.params.bookingId;
    
    try {
        // Get booking details with payment and invoice info
        const bookingQuery = `
            SELECT bt.*, t.title, t.subtitle, p.transaction_id, p.payment_method, 
                   i.invoice_number, i.total_amount
            FROM booked_tickets bt
            JOIN ticket t ON bt.ticket_id = t.id
            LEFT JOIN payments p ON bt.payment_id = p.id
            LEFT JOIN invoices i ON bt.id = i.booking_id
            WHERE bt.id = ? AND bt.user_id = ?
        `;
        
        const booking = await new Promise((resolve, reject) => {
            global.db.get(bookingQuery, [bookingId, req.session.user.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!booking) {
            return res.status(404).render('error', { message: 'Booking not found' });
        }
        
        res.render('booking-confirmation', {
            booking,
            user: req.session.user
        });
        
    } catch (err) {
        console.error('Error fetching booking:', err);
        res.status(500).render('error', { message: 'Error fetching booking details' });
    }
});

// Download invoice
router.get("/invoice/:bookingId", requireAuth, async (req, res) => {
    const bookingId = req.params.bookingId;
    
    try {
        const invoice = await paymentProcessor.getInvoiceByBookingId(bookingId);
        
        if (!invoice) {
            return res.status(404).render('error', { message: 'Invoice not found' });
        }
        
        // Verify user owns this booking
        const bookingCheck = await new Promise((resolve, reject) => {
            global.db.get('SELECT user_id FROM booked_tickets WHERE id = ?', [bookingId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!bookingCheck || bookingCheck.user_id !== req.session.user.id) {
            return res.status(403).render('error', { message: 'Access denied' });
        }
        
        res.render('invoice', {
            invoice,
            user: req.session.user
        });
        
    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).render('error', { message: 'Error fetching invoice' });
    }
});

// Legacy route - redirect to new home page
router.get("/customer-sales-page-d", (req, res) => {
    res.redirect('/events');
});

// Admin dashboard route
router.get("/admin", (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('error', { message: 'Access denied. Admin privileges required.' });
    }
    
    const queryDrafts = "SELECT * FROM ticket WHERE published_date IS NULL ORDER BY created_at DESC";
    const queryPublished = "SELECT * FROM ticket WHERE published_date IS NOT NULL ORDER BY published_date DESC";
    
    global.db.all(queryDrafts, (err, drafts) => {
        if(err) {
            console.error('Error fetching drafts:', err);
            return res.status(500).render('error', { message: "Error fetching draft events" });
        }
        
        global.db.all(queryPublished, (err, published) => {
            if(err) {
                console.error('Error fetching published:', err);
                return res.status(500).render('error', { message: "Error fetching published events" });
            }
            
            res.render('admin-home.ejs', { 
                drafts: drafts || [],
                published: published || [],
                user: req.session.user
            });
        });
    });
});

router.get("/bookings", requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  console.log("UserId :", userId);
  
  const query = `
    SELECT 
      b.id AS booking_id,
      b.invoice_number,
      t.title AS event_title,
      t.subtitle AS event_subtitle,
      b.ticket_type,
      b.quantity,
      b.total_price,
      b.booking_date,
      b.booking_status,
      p.transaction_id,
      p.payment_method,
      p.payment_status,
      p.amount_paid
    FROM 
      booked_tickets b
    JOIN 
      ticket t ON b.ticket_id = t.id
    LEFT JOIN 
      payments p ON b.id = p.booking_id
    WHERE 
      b.user_id = ?
    ORDER BY b.booking_date DESC`;

  try {
    const bookings = await new Promise((resolve, reject) => {
      global.db.all(query, [userId], (err, rows) => {
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

    res.render("bookings.ejs", { 
      bookings,
      user: req.session.user
    });
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



// Cart route
router.get("/cart", requireAuth, async (req, res) => {
    try {
        // Get pending bookings for the user
        const query = `
            SELECT bt.*, t.title, t.subtitle, t.published_date 
            FROM booked_tickets bt 
            JOIN ticket t ON bt.ticket_id = t.id 
            WHERE bt.user_id = ? AND bt.booking_status = 'pending'
            ORDER BY bt.id DESC
        `;
        
        const cartItems = await new Promise((resolve, reject) => {
            global.db.all(query, [req.session.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        // Calculate total
        const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);
        
        res.render('cart', {
            cartItems,
            totalAmount,
            user: req.session.user
        });
        
    } catch (err) {
        console.error('Cart error:', err);
        res.status(500).render('error', { message: 'Error loading cart' });
    }
});

// Remove item from cart
router.post("/cart/remove/:bookingId", requireAuth, async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        
        // Verify the booking belongs to the user
        const booking = await new Promise((resolve, reject) => {
            global.db.get('SELECT * FROM booked_tickets WHERE id = ? AND user_id = ?', [bookingId, req.session.user.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Delete the booking
        await new Promise((resolve, reject) => {
            global.db.run('DELETE FROM booked_tickets WHERE id = ?', [bookingId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.redirect('/products/cart');
        
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ error: 'Error removing item from cart' });
    }
});

// Proceed to payment from cart
router.post("/cart/checkout", requireAuth, async (req, res) => {
    try {
        // Get all pending bookings for the user
        const cartItems = await new Promise((resolve, reject) => {
            global.db.all('SELECT * FROM booked_tickets WHERE user_id = ? AND booking_status = "pending"', [req.session.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        if (cartItems.length === 0) {
            return res.redirect('/products/cart?error=empty');
        }
        
        // For now, redirect to payment with the first booking ID
        // In a real implementation, you might want to create a combined booking
        res.redirect(`/products/payment/${cartItems[0].id}`);
        
    } catch (err) {
        console.error('Cart checkout error:', err);
        res.status(500).render('error', { message: 'Error processing checkout' });
    }
});

module.exports = router;
