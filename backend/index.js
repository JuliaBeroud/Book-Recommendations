import express from "express";
import mysql from "mysql2";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

// ---- ESM-friendly __dirname
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- App & middleware
const app = express();
app.use(cors());
app.use(express.json());

// ---- Static hosting for uploaded files (e.g., http://localhost:8800/uploads/<filename>)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// Turn a cover URL (absolute or relative) into a local path under uploadsDir.
// Returns null if the path isn't inside /uploads (prevents deleting arbitrary files).
function getLocalUploadPath(cover) {
  if (!cover) return null;
  try {
    let pathname = cover;

    // If it's an absolute URL, extract its pathname
    if (cover.startsWith("http://") || cover.startsWith("https://")) {
      pathname = new URL(cover).pathname; // e.g. "/uploads/123.png"
    }

    // Only allow files inside /uploads/
    if (!pathname.startsWith("/uploads/")) return null;

    // Use basename to avoid directory traversal
    const filename = path.basename(pathname);
    return path.join(uploadsDir, filename);
  } catch {
    return null;
  }
}

// ---- Multer config (store on disk)
// Limit to images, max 5 MB
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const ok = /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/.test(file.mimetype);
  cb(null, ok);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ---- DB
const db = mysql.createConnection({
 host:"127.0.0.1",
user:"root",
password:"Sebobonono11!",
port: 3306,
database:"test"
});

// ---- Health
app.get("/", (req, res) => {
  res.json("this is the backend");
});

// ---- Uploads
app.post("/uploads", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Invalid file type or no file uploaded." });
  }

  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const imageUrl = `${base}/uploads/${req.file.filename}`;

  return res.json({ imageUrl });
});

// GET all
app.get("/books", (req, res) => {
  const q = "SELECT * FROM Books";
  db.query(q, (err, data) => {
    if (err) {
      console.error("MySQL error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json(data);
  });
});

// CREATE
app.post("/books", (req, res) => {
  const q =
    "INSERT INTO Books (`title`, `desc`, `price`, `cover`) VALUES (?, ?, ?, ?)";
  const values = [req.body.title, req.body.desc, req.body.price, req.body.cover];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("MySQL error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json({ message: "Book has been created successfully", id: data?.insertId });
  });
});

app.delete("/books/:id", (req, res) => {
  const bookId = req.params.id;

  // fetch cover URL for this book
  db.query("SELECT cover FROM Books WHERE id = ?", [bookId], (selErr, rows) => {
    if (selErr) {
      console.error("MySQL error (select cover):", selErr);
      return res.status(500).json({ error: "Database error" });
    }
    const cover = rows?.[0]?.cover || null;
    const localPath = getLocalUploadPath(cover);

    // delete DB row
    db.query("DELETE FROM Books WHERE id = ?", [bookId], (delErr) => {
      if (delErr) {
        console.error("MySQL error (delete):", delErr);
        return res.status(500).json({ error: "Database error" });
      }

      // best-effort delete local file (non-blocking)
      if (localPath) {
        fs.unlink(localPath, (fsErr) => {
          if (fsErr && fsErr.code !== "ENOENT") {
            console.warn("Could not delete cover file:", fsErr.message);
          }
        });
      }

      return res.json({ message: "Book deleted" });
    });
  });
});

// UPDATE
app.put("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const q =
    "UPDATE Books SET `title` = ?, `desc` = ?, `price` = ?, `cover` = ? WHERE id = ?";

  const values = [req.body.title, req.body.desc, req.body.price, req.body.cover];

  db.query(q, [...values, bookId], (err, data) => {
    if (err) {
      console.error("MySQL error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json({ message: "Book has been updated successfully" });
  });
});

// ---- Start
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Connected to backend on http://localhost:${PORT}`);
});
