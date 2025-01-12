
const express = require("express");
// const { route } = require("./products");
const router = express.Router();

// router.post();

router.get("/customer-checkout/:id", (req, res) => {

    const event = {
        title: 'Concert Night',
        description: 'An amazing evening of live music.',
        date: '2025-01-15',
        ticketsAvailable: 100,
        ticketTypes: [
          { id: 1, name: 'General Admission', price: 50 },
          { id: 2, name: 'VIP', price: 150 },
        ],
        maxTicketsPerPerson: 5,
      };

    res.render("customer-checkout.ejs", { event });
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
        url: `event-${event.id}`
      }));
      res.render('customer-sales-page.ejs', { events });
    });
});

module.exports = router;
