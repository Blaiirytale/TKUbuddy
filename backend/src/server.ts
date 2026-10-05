import express from "express";
import pool from "./db";

const app = express();

// Needed as soon as you have POST/PATCH routes, so req.body is filled in
app.use(express.json());

// Hosting services choose the port, so read it from .env first
const port = Number(process.env.PORT) || 3000;

app.get("/", (req, res) => {
  res.send("TKU Buddy backend is running");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database connection failed"
    });
  }
});

// All courses
app.get("/courses", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT code, name_en, name_zh, credits, department FROM courses ORDER BY code"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load courses" });
  }
});

// One course by code, e.g. /courses/0606
app.get("/courses/:code", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT code, name_en, name_zh, credits, department FROM courses WHERE code = $1",
      [req.params.code]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load the course" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});