import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db, { initDb } from "./db.ts";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";
const PORT = 3000;

async function startServer() {
  initDb();
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    try {
      db.prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)").run(userId, email, hashedPassword);
      
      // Auto-create default profile
      const profileId = uuidv4();
      db.prepare("INSERT INTO profiles (id, user_id, name) VALUES (?, ?, ?)").run(profileId, userId, "Main Profile");

      const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ id: userId, email });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ id: user.id, email: user.email, subscription_status: user.subscription_status });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, email, subscription_status FROM users WHERE id = ?").get(req.user.id) as any;
    res.json(user);
  });

  // Profiles
  app.get("/api/profiles", authenticate, (req: any, res) => {
    const profiles = db.prepare("SELECT * FROM profiles WHERE user_id = ?").all(req.user.id);
    res.json(profiles);
  });

  app.post("/api/profiles", authenticate, (req: any, res) => {
    const { name, is_kids_mode } = req.body;
    const profileId = uuidv4();
    db.prepare("INSERT INTO profiles (id, user_id, name, is_kids_mode) VALUES (?, ?, ?, ?)").run(
      profileId, req.user.id, name, is_kids_mode ? 1 : 0
    );
    res.json({ id: profileId, name, is_kids_mode });
  });

  app.put("/api/profiles/:id", authenticate, (req: any, res) => {
    const { name, is_kids_mode } = req.body;
    db.prepare("UPDATE profiles SET name = ?, is_kids_mode = ? WHERE id = ? AND user_id = ?").run(
      name, is_kids_mode ? 1 : 0, req.params.id, req.user.id
    );
    res.json({ success: true });
  });

  app.delete("/api/profiles/:id", authenticate, (req: any, res) => {
    // Prevent deleting the last profile
    const count = db.prepare("SELECT count(*) as count FROM profiles WHERE user_id = ?").get(req.user.id) as any;
    if (count.count <= 1) {
      return res.status(400).json({ message: "Cannot delete the only profile" });
    }

    db.prepare("DELETE FROM profiles WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Content
  app.get("/api/content", authenticate, (req: any, res) => {
    const { type, genre, featured } = req.query;
    let query = "SELECT * FROM content WHERE 1=1";
    const params: any[] = [];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    if (featured) {
      query += " AND is_featured = 1";
    }
    if (genre) {
      query += " AND genre LIKE ?";
      params.push(`%${genre}%`);
    }

    const content = db.prepare(query).all(...params);
    res.json(content);
  });

  app.get("/api/content/:id", authenticate, (req, res) => {
    const item = db.prepare("SELECT * FROM content WHERE id = ?").get(req.params.id);
    if (!item) return res.status(404).json({ message: "Content not found" });
    res.json(item);
  });

  // Watchlist
  app.get("/api/watchlist/:profileId", authenticate, (req, res) => {
    const watchlist = db.prepare(`
      SELECT c.* FROM content c
      JOIN watchlist w ON c.id = w.content_id
      WHERE w.profile_id = ?
    `).all(req.params.profileId);
    res.json(watchlist);
  });

  app.post("/api/watchlist", authenticate, (req, res) => {
    const { profileId, contentId } = req.body;
    try {
      db.prepare("INSERT INTO watchlist (profile_id, content_id) VALUES (?, ?)").run(profileId, contentId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: "Already in watchlist or error" });
    }
  });

  app.delete("/api/watchlist", authenticate, (req, res) => {
    const { profileId, contentId } = req.body;
    db.prepare("DELETE FROM watchlist WHERE profile_id = ? AND content_id = ?").run(profileId, contentId);
    res.json({ success: true });
  });

  // Search
  app.get("/api/search", authenticate, (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = db.prepare(`
      SELECT * FROM content 
      WHERE title LIKE ? OR genre LIKE ? OR description LIKE ?
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);
    res.json(results);
  });

  // Recommendation (Basic algorithm)
  app.get("/api/recommendations/:profileId", authenticate, (req, res) => {
    // Get last watched genre
    const lastWatched = db.prepare(`
      SELECT c.genre FROM content c
      JOIN watch_history h ON c.id = h.content_id
      WHERE h.profile_id = ?
      ORDER BY h.last_watched DESC LIMIT 1
    `).get(req.params.profileId) as any;

    if (lastWatched) {
      const recommendations = db.prepare(`
        SELECT * FROM content 
        WHERE genre LIKE ? AND id NOT IN (
          SELECT content_id FROM watch_history WHERE profile_id = ?
        )
        LIMIT 10
      `).all(`%${lastWatched.genre}%`, req.params.profileId);
      res.json(recommendations);
    } else {
      // Fallback to trending/featured
      const trending = db.prepare("SELECT * FROM content ORDER BY created_at DESC LIMIT 10").all();
      res.json(trending);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
