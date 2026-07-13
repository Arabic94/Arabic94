const express = require("express");
const Student = require("../models/Student");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/student/me
router.get("/me", requireAuth, async (req, res) => {
  const student = await Student.findById(req.studentId);
  if (!student) return res.status(404).json({ error: "الطالب غير موجود" });
  res.json({ student: Student.toPublicJSON(student) });
});

// PUT /api/student/avatar   { avatar }
router.put("/avatar", requireAuth, async (req, res) => {
  const { avatar } = req.body;
  if (!["boy1", "boy2", "girl1", "girl2"].includes(avatar)) {
    return res.status(400).json({ error: "أفتار غير صالح" });
  }
  const student = await Student.updateAvatar(req.studentId, avatar);
  if (!student) return res.status(404).json({ error: "الطالب غير موجود" });
  res.json({ student: Student.toPublicJSON(student) });
});

// PUT /api/student/progress   { batchIndex, passed }
// Only advances maxBatchReached when passed === true AND batchIndex matches
// the student's current maxBatchReached — a server-side guard so a student
// can't unlock batches by calling the API directly out of order.
router.put("/progress", requireAuth, async (req, res) => {
  const { batchIndex, passed } = req.body;
  if (typeof batchIndex !== "number" || typeof passed !== "boolean") {
    return res.status(400).json({ error: "بيانات غير صالحة" });
  }
  const student = await Student.findById(req.studentId);
  if (!student) return res.status(404).json({ error: "الطالب غير موجود" });

  if (batchIndex !== student.max_batch_reached) {
    return res.json({ student: Student.toPublicJSON(student) });
  }

  const batchPassed = [...student.batch_passed];
  batchPassed[batchIndex] = passed;
  const newMax = passed
    ? Math.min(student.max_batch_reached + 1, student.total_batches)
    : student.max_batch_reached;

  const updated = await Student.updateProgress(req.studentId, batchPassed, newMax);
  res.json({ student: Student.toPublicJSON(updated) });
});

module.exports = router;
