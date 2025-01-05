
const express = require("express");
// const { route } = require("./products");
const router = express.Router();

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

router.get("/customer-checkout", (req, res) => {
    res.render("customer-checkout.ejs");
});

// router.post();

router.get("/customer-sales-page", (req, res) => {
    res.render("customer-sales-page.ejs");
});

// router.post();

module.exports = router;
