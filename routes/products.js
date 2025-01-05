
const express = require("express");
const router = express.Router();

router.get("/admin-home", (req, res) => {
    res.render("admin-home.ejs");
});

module.exports = router;
