require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./pool");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  try {
    await pool.query(sql);
    console.log("✅ الجداول جاهزة على قاعدة بيانات Neon");
  } catch (err) {
    console.error("❌ فشل إنشاء الجداول:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
