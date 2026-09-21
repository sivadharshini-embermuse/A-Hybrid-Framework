const express = require('express');
const path = require('path');
const cors = require("cors");
const db=require('./config/db')
// const attendanceRoutes = require('./routes/attendance');

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const routes = require("./routes/attendanceRoutes");
app.use('/', routes);
// app.get("/",(req,res)=>{
//     res.send("hello")
// })



app.listen(3000, () => console.log('Server running on http://localhost:3000'));
