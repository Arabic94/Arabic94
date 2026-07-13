const { Pool } = require("pg");

// Neon requires SSL. rejectUnauthorized:false is fine here since Neon uses
// publicly trusted certs but pg's default bundle handling can be finicky
// across environments — this keeps the connection simple and reliable.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("خطأ غير متوقع من قاعدة البيانات:", err);
});

module.exports = pool;
