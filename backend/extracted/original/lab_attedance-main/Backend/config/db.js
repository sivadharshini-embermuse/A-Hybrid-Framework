const mysql = require("mysql2");
const dotenv = require("dotenv"); 

//configure dotenv to load environment variables
dotenv.config({
  path: "./.env",
});

// Check if database credentials are missing
if (
  !process.env.MYSQL_HOST ||
  !process.env.MYSQL_USER ||
  !process.env.MYSQL_PASSWORD ||
  !process.env.MYSQL_DATABASE
) {
  console.error("Missing database environment variables!");
  process.exit(1); // Stop execution if database credentials are missing
}
// Log the database connection details for debugging
console.log("Database connection details:");
console.log(`Host: ${process.env.MYSQL_HOST}`);
console.log(`User: ${process.env.MYSQL_USER}`);
console.log(`Database: ${process.env.MYSQL_DATABASE}`);
console.log(`Password: ${process.env.MYSQL_PASSWORD}`); // Do not log password for security reasons

// prints the database connection details for debugging
console.log("Connecting to database with the above details:");
//create a connection to the database
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z", // Set timezone to UTC
});

// Test the connection immediately
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to the database:", err);
    process.exit(1);
  } else {
    console.log("✅ Successfully connected to the database!");
    connection.release(); // Return connection to pool
  }
});

// Export the database connection pool
module.exports = db.promise();