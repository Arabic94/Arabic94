const pool = require("../db/pool");

const TOTAL_BATCHES = 20; // 100 words / 5 per batch

function toPublicJSON(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    avatar: row.avatar,
    totalBatches: row.total_batches,
    maxBatchReached: row.max_batch_reached,
    batchPassed: row.batch_passed,
  };
}

async function findByNameLower(nameLower) {
  const { rows } = await pool.query(
    "SELECT * FROM students WHERE name_lower = $1",
    [nameLower]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
  return rows[0] || null;
}

async function createStudent({ name, nameLower, age, passwordHash, avatar }) {
  const batchPassed = Array(TOTAL_BATCHES).fill(false);
  const { rows } = await pool.query(
    `INSERT INTO students (name, name_lower, age, password_hash, avatar, total_batches, max_batch_reached, batch_passed)
     VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
     RETURNING *`,
    [name, nameLower, age, passwordHash, avatar || "boy1", TOTAL_BATCHES, batchPassed]
  );
  return rows[0];
}

async function updateAvatar(id, avatar) {
  const { rows } = await pool.query(
    "UPDATE students SET avatar = $1 WHERE id = $2 RETURNING *",
    [avatar, id]
  );
  return rows[0] || null;
}

async function updateProgress(id, batchPassed, maxBatchReached) {
  const { rows } = await pool.query(
    "UPDATE students SET batch_passed = $1, max_batch_reached = $2 WHERE id = $3 RETURNING *",
    [batchPassed, maxBatchReached, id]
  );
  return rows[0] || null;
}

module.exports = {
  TOTAL_BATCHES,
  toPublicJSON,
  findByNameLower,
  findById,
  createStudent,
  updateAvatar,
  updateProgress,
};
