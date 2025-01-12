
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
   // const event = {
    //     title: 'Concert Night',
    //     description: 'An amazing evening of live music.',
    //     date: '2025-01-15',
    //     ticketsAvailable: 100,
    //     ticketTypes: [
    //       { id: 1, name: 'General Admission', price: 50 },
    //       { id: 2, name: 'VIP', price: 150 },
    //     ],
    //     maxTicketsPerPerson: 5,
    //   };

    // res.render("customer-checkout.ejs", { event });

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

module.exports = router;
