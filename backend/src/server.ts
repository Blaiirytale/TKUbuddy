import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
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


function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing from .env");
  }
  return secret;
}

// Register a new student
app.post("/auth/register", async (req, res) => {
  try {
    const {
      student_id,
      name_zh,
      nickname,
      password,
      department,
      entry_year
    } = req.body;

    if (
      typeof student_id !== "string" ||
      !student_id.trim() ||
      typeof name_zh !== "string" ||
      !name_zh.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Student ID and name are required; password must be at least 8 characters"
      });
    }

    if (
      nickname !== undefined &&
      nickname !== null &&
      typeof nickname !== "string"
    ) {
      return res.status(400).json({ message: "Invalid nickname" });
    }

    if (
      department !== undefined &&
      department !== null &&
      typeof department !== "string"
    ) {
      return res.status(400).json({ message: "Invalid department" });
    }

    if (
      entry_year !== undefined &&
      entry_year !== null &&
      (!Number.isInteger(entry_year) ||
        entry_year < 2000 ||
        entry_year > 2100)
    ) {
      return res.status(400).json({ message: "Invalid entry year" });
    }

    const existing = await pool.query(
      "SELECT student_id FROM students WHERE student_id = $1",
      [student_id.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this student ID already exists"
      });
    }

    // Check the department before inserting, if one was provided.
    if (department) {
      const dept = await pool.query(
        "SELECT name_en FROM departments WHERE name_en = $1",
        [department]
      );

      if (dept.rows.length === 0) {
        return res.status(400).json({
          message: "Please select a valid department"
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO students
        (student_id, name_zh, nickname, password_hash, department, entry_year)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING student_id, name_zh, nickname, department, entry_year`,
      [
        student_id.trim(),
        name_zh.trim(),
        nickname?.trim() || null,
        passwordHash,
        department || null,
        entry_year ?? null
      ]
    );

    const student = result.rows[0];
    const token = jwt.sign(
      { student_id: student.student_id },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.status(201).json({ token, student });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Could not register student"
    });
  }
});

// Log in an existing student
app.post("/auth/login", async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (
      typeof student_id !== "string" ||
      !student_id.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Enter your student ID and password"
      });
    }

    const result = await pool.query(
      `SELECT student_id, password_hash
       FROM students
       WHERE student_id = $1`,
      [student_id.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid student ID or password"
      });
    }

    const student = result.rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      student.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid student ID or password"
      });
    }

    const token = jwt.sign(
      { student_id: student.student_id },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Could not log in"
    });
  }
});

// Get the profile of the logged-in student
app.get("/me", async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let payload: jwt.JwtPayload;

    try {
      const decoded = jwt.verify(token, getJwtSecret());

      if (
        typeof decoded === "string" ||
        typeof decoded.student_id !== "string"
      ) {
        return res.status(401).json({ message: "Invalid token" });
      }

      payload = decoded;
    } catch {
      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }

    const result = await pool.query(
      `SELECT student_id, name_zh, nickname, department, entry_year
       FROM students
       WHERE student_id = $1`,
      [payload.student_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Student account not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({
      message: "Could not load student profile"
    });
  }
});


/*app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});*/
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});