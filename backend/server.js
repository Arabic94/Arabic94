require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");

const authRoutes = require("./routes/auth");
const progressRoutes = require("./routes/progress");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "arabic-reader-backend-neon" });
});

app.use("/", authRoutes);
app.use("/student", progressRoutes);

const PORT = process.env.PORT || 5000;

pool
  .query("SELECT 1")
  .then(() => {
    console.log("✅ متصل بقاعدة بيانات Neon");
    app.listen(PORT, () => console.log(`🚀 السيرفر شغال على المنفذ ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message);
    process.exit(1);
  });
