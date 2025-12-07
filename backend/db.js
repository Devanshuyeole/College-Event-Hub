require('dotenv').config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Root",
  database: process.env.DB_NAME || "CollegeEventHub"
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err);
    throw err;
  }
  console.log("✅ MySQL Connected to", process.env.DB_NAME || "CollegeEventHub");
});

module.exports = db;