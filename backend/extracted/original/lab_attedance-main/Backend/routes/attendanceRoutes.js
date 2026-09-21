const express = require("express");
const db = require("../config/db");
const entry = require("../controllers/entry");
const router = express.Router();

// Home Page
router.use("/home", (req,res)=>{
    res.send({"name":"Machine Learning"})
});

// router.use("/",(req,res)=>{
//     res.send("hello")
// })

router.use("/register",entry.enrtry)

module.exports = router;