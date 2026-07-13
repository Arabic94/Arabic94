const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

const router = express.Router();

function signToken(studentId) {
  return jwt.sign({ studentId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// POST /api/register  { name, age, password, avatar }
router.post("/register", async (req, res) => {
  try {
    const { name, age, password, avatar } = req.body;
    if (!name || !age || !password) {
      return res.status(400).json({ error: "الاسم والعمر وكلمة المرور مطلوبة" });
    }
    const nameLower = String(name).trim().toLowerCase();
    const existing = await Student.findByNameLower(nameLower);
    if (existing) {
      return res.status(409).json({ error: "هذا الاسم مستخدم من قبل" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const student = await Student.createStudent({
      name: String(name).trim(),
      nameLower,
      age,
      passwordHash,
      avatar,
    });
    const token = signToken(student.id);
    res.status(201).json({ token, student: Student.toPublicJSON(student) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الحساب" });
  }
});

// POST /api/login  { name, password }
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: "الاسم وكلمة المرور مطلوبان" });
    }
    const nameLower = String(name).trim().toLowerCase();
    const student = await Student.findByNameLower(nameLower);
    if (!student) {
      return res.status(404).json({ error: "لا يوجد حساب بهذا الاسم" });
    }
    const ok = await bcrypt.compare(password, student.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    }
    const token = signToken(student.id);
    res.json({ token, student: Student.toPublicJSON(student) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول" });
  }
});

module.exports = router;
