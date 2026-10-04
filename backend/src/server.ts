import express from "express";
import pool from "./db";

const app = express();

const port = 3000;

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

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});