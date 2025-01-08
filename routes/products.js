
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

// router.post();

router.get("/customer-sales-page-d", (req, res) => {

    const events = [
        { name: 'Event 1', url: '/event-1' },
        { name: 'Event 2', url: null },
        { name: 'Event 3', url: null },
        { name: 'Event 4', url: null },
      ];
      
    res.render('customer-sales-page.ejs', { events });

    // res.render("customer-sales-page.ejs");
});

// router.post();

module.exports = router;
