const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const User = require("./models/User.cjs");
const Admin = require("./models/Admin.cjs");
const Post = require("./models/Post.cjs");
const Page = require("./models/Page.cjs");
const Flipbook = require("./models/Flipbook.cjs");
const Subscription = require("./models/Subscription.cjs");
const Product = require("./models/Product.cjs");
const SiteSettings = require("./models/SiteSettings.cjs");

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "brainfeed-jwt-secret-change-in-production";
const isProduction = process.env.NODE_ENV === "production";
const DATA_DIR = path.join(__dirname, "data");
const ARTICLES_PATH = path.join(DATA_DIR, "articles.json");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const imageFilter = (req, file, cb) => {
  const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};
const mediaFilter = (req, file, cb) => {
  const allowed = /^image\/(jpeg|jpg|png|gif|webp)|^audio\/|^video\//;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid media type"), false);
};
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: imageFilter,
});
const uploadPostMedia = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: mediaFilter,
});
const uploadProductImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};
const uploadFlipbookPdf = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: pdfFilter,
});

function readArticles() {
  try {
    const raw = fs.readFileSync(ARTICLES_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

function writeArticles(articles) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (_) {}
  fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2), "utf8");
}

const app = express();

// Trust first proxy (Railway, Vercel, etc.) so X-Forwarded-* and client IP are correct
app.set("trust proxy", 1);

// ----- CORS (use cors package so preflight is always correct on Railway) -----
const DEFAULT_ORIGINS = [
  "https://brainfeed-frontend.vercel.app",
  "https://brainfeed-frontend-shgo.vercel.app",
  "https://brainfeed-frontend-eight.vercel.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
];
const allowedOrigins = [...DEFAULT_ORIGINS];
const envOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "").trim();
if (envOrigins) {
  envOrigins.split(",").forEach((o) => {
    const s = o.trim();
    if (s && !allowedOrigins.includes(s)) allowedOrigins.push(s);
  });
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    // Check exact match first
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any Vercel preview deployment subdomain
    if (origin.match(/^https:\/\/brainfeed-frontend-[a-z0-9]+\.vercel\.app$/)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const value = (origin && allowedOrigins.includes(origin)) ? origin : allowedOrigins[0];
  res.setHeader("Access-Control-Allow-Origin", value);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

app.use(express.json());

const mongoUri = (process.env.MONGO_URI || "").trim();

// Root – so deployed URL works for quick checks (CORS applied by middleware)
app.get("/", (req, res) => {
  res.json({ ok: true, api: "Brainfeed API", health: "/api/health", capabilities: "/api/capabilities" });
});

// Health check: MongoDB reachable + Cloudinary config (no auth required). Never throws 500.
app.get("/api/health", async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const cloudinaryConfigured = Boolean(
      cloudName &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    let mongoStatus = "not connected";
    let databaseName = null;
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.db.admin().ping();
        mongoStatus = "connected";
        databaseName = mongoose.connection.db.databaseName || "Brainfeed";
      } catch (e) {
        mongoStatus = "ping failed";
      }
    }
    const ok = mongoStatus === "connected" && cloudinaryConfigured;
    res.json({
      ok,
      mongo: mongoStatus,
      cloudinary: cloudinaryConfigured ? "configured" : "missing env vars",
      database: databaseName,
    });
  } catch (e) {
    console.error("Health check error:", e);
    res.status(500).json({ ok: false, mongo: "error", cloudinary: "unknown", error: e.message });
  }
});

/** Public: verify deployed API includes flipbooks (admin routes require auth). If this 404s, redeploy backend from latest `backend/` code. */
app.get("/api/capabilities", (req, res) => {
  res.json({
    flipbooks: true,
    adminFlipbooks: "/api/admin/flipbooks",
    publicFlipbooks: "/api/flipbooks",
  });
});

// MongoDB: connect in background so app stays up even if DB is slow or temporarily down
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
};

if (mongoUri) {
  mongoose.connect(mongoUri, mongooseOptions)
    .then((conn) => {
      const dbName = conn.connection?.db?.databaseName || "Brainfeed";
      console.log("MongoDB connected to database:", dbName);
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      console.error("Check MONGO_URI in Railway env and network. API will respond but auth/posts will fail until connected.");
    });
} else {
  console.warn("MONGO_URI is not set in .env – admin/login and posts will not work.");
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Admin authentication required" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.adminId) return res.status(403).json({ error: "Not an admin" });

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) return res.status(403).json({ error: "Admin not found" });

    const adminEnvEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const isEnvAdminUser = adminEnvEmail && admin.email === adminEnvEmail;

    // Compute role from the database, forcing ENV admin to be full "admin"
    let role = admin.role;
    if (isEnvAdminUser) {
      if (admin.role !== "admin") {
        admin.role = "admin";
        await admin.save();
      }
      role = "admin";
    } else {
      role = role || "editor";
      if (!admin.role) {
        admin.role = role;
        await admin.save();
      }
    }

    req.adminId = admin._id.toString();
    req.adminRole = role;
    req.adminEmail = admin.email || "";
    req.adminName = getAdminDisplayName(admin);
    next();
  } catch (e) {
    console.error("Admin auth error:", e);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

const ADMIN_ROLES = ["admin", "editor"];

function getAdminDisplayName(admin) {
  const explicit = String(admin?.name || "").trim();
  if (explicit) return explicit;
  const local = String(admin?.email || "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  if (!local) return "Admin";
  return local
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function requireAdminRole(requiredRole) {
  return (req, res, next) => {
    const role = req.adminRole || "admin";
    if (role !== requiredRole) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

async function uploadToCloudinary(buffer, mimeType, folder) {
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(dataUri, { folder }, (err, res) => (err ? reject(err) : resolve(res)));
  });
}

/** PDF / raw files — Cloudinary `raw` resource type */
async function uploadPdfToCloudinary(buffer, mimeType, folder) {
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      { folder, resource_type: "raw", use_filename: true, unique_filename: true },
      (err, res) => (err ? reject(err) : resolve(res))
    );
  });
}

function getDefaultSiteSettings() {
  return {
    key: "default",
    homeHero: {
      eyebrow: "Since 2009 — Trusted by 40,000+ schools",
      title: "Today's Readers are",
      titleAccent: "Tomorrow's Leaders",
      subtitle1: "India's premier educational monthly — nurturing 200,000+ young minds with five specialized publications.",
      subtitle2:
        "Brainfeed brings educators, parents and students one step closer—covering board exams, NEP 2020, classroom practices and wellbeing in a single, beautifully curated reading experience.",
      backgroundImageUrl: "",
    },
    homeLayout: {
      latestNewsFeaturedId: "",
      latestNewsSideIds: [],
      expertViewIds: [],
      editorsPickIds: [],
      technologyIds: [],
      parentingIds: [],
      latestMagazineIds: [],
    },
    topBar: {
      links: [
        { label: "Michampsindia", url: "https://michampsindia.com/" },
        { label: "Higher Education Plus", url: "https://highereducationplus.com/" },
        { label: "School Search", url: "https://brainfeedmagazine.com/schools-search/" },
      ],
      social: {
        facebook: "https://www.facebook.com/brainfeededumag",
        twitter: "https://twitter.com/brainfeededumag",
        instagram: "https://www.instagram.com/brainfeededumag/",
        linkedin: "https://www.linkedin.com/in/brainfeededumag/",
        youtube: "https://www.youtube.com/@brainfeedmagazine",
        email: "info@brainfeedmagazine.com",
      },
    },
    footer: {
      description: "India's premier education magazine empowering educators, parents, and students since 2010.",
      email: "admin@brainfeedmagazine.com",
      social: {
        facebook: "https://www.facebook.com/brainfeededumag",
        twitter: "https://twitter.com/brainfeededumag",
        instagram: "https://www.instagram.com/brainfeededumag/",
        linkedin: "https://www.linkedin.com/in/brainfeededumag/",
        youtube: "https://www.youtube.com/@brainfeedmagazine",
        email: "info@brainfeedmagazine.com",
      },
    },
    about: {
      heroEyebrow: "Knowing Brainfeed",
      heroTitle: "Empowering children in their journey of literacy, numeracy and beyond.",
      heroBody:
        "Since 2013 we have been working with schools, educators and childhood advocacy organisations to keep the reading habit alive among the growing minds that are the destiny of our nation tomorrow.",
      heroImageUrl: "",
      heroImageAlt: "",
      aboutCoverMain: "",
      aboutCoverPrimary2: "",
      aboutCoverPrimary1: "",
      aboutCoverJunior: "",
      stat1Value: "60,000+",
      stat1Label: "Schools Reached",
      stat2Value: "3 Lakh+",
      stat2Label: "School Leaders & Educators",
      stat3Value: "1,75,000",
      stat3Label: "Subscribers",
      stat4Value: "45+",
      stat4Label: "Educational Conferences",
      stat5Value: "12,000+",
      stat5Label: "Leaders Recognised",
      conferencesBody:
        "Our educational conferences and expos have seen active participation from 8,000+ educational leaders and 250+ leading brands. Since 2013 we have organised 45+ conferences — a space for school leaders and educators to share ideas, identify trends and network with peers.",
      awardsBody:
        "Brainfeed has recognised the contribution of over 12,000 leaders, educators, and companies in the educational products and services segment, conferring them with respective awards for excellence and innovation.",
      ctaTitle:
        "Ten years and still counting — trusted by readers who swear by our objectivity and quality.",
    },
    contact: {
      addressLines: [
        "Kakani Edu Media Pvt Ltd",
        "Plot No: 47, Rd Number 4A, adjacent to Bose Edifice,",
        "Golden Tulip Estate, Raghavendra Colony, Hyderabad,",
        "Telangana 500084",
      ],
      whatsapp: "918448737157",
      phoneAlt: "",
      emails: ["info@brainfeedmagazine.com", "kakani2406@gmail.com"],
      regionTitle: "Punjab Region",
      regionName: "Katyayani Singh",
      regionWhatsapp: "918448737157",
      regionEmail: "katyayanis2019@gmail.com",
      mapUrl:
        "https://www.google.com/maps?ll=17.473071,78.357614&z=22&t=m&hl=en&gl=IN&mapclient=embed&cid=16509507856910290038",
      mapEmbedUrl: "https://www.google.com/maps?q=17.473071,78.357614&z=22&output=embed",
    },
  };
}

async function getOrCreateSiteSettings() {
  const existing = await SiteSettings.findOne({ key: "default" }).lean();
  if (existing) return existing;
  const created = await SiteSettings.create(getDefaultSiteSettings());
  return created.toJSON();
}

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, howDidYouHear, wantsUpdates } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      howDidYouHear: howDidYouHear ? String(howDidYouHear).trim() : "",
      wantsUpdates: wantsUpdates !== false,
    });
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ user: user.toJSON(), token });
  } catch (e) {
    res.status(500).json({ error: e.message || "Sign up failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected. Check MONGO_URI and try again." });
    }
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: user.toJSON(), token });
  } catch (e) {
    console.error("Auth login error:", e);
    res.status(500).json({ error: e.message || "Login failed" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to get user" });
  }
});

app.patch("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    const { name, howDidYouHear, wantsUpdates } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (howDidYouHear !== undefined) update.howDidYouHear = String(howDidYouHear).trim();
    if (wantsUpdates !== undefined) update.wantsUpdates = wantsUpdates !== false;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update profile" });
  }
});

// ----- Admin auth -----
app.post("/api/admin/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected. Check MONGO_URI and try again." });
    }
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const adminEmail = String(email).trim().toLowerCase();
    const passwordTrimmed = String(password).trim();
    const adminEnvEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminEnvPassword = (process.env.ADMIN_PASSWORD || "").trim();

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      // First-time login using ENV admin credentials creates a permanent admin user
      if (adminEnvEmail && adminEnvPassword && adminEnvEmail === adminEmail) {
        const hashed = await bcrypt.hash(adminEnvPassword, 10);
        admin = await Admin.create({
          name: getAdminDisplayName({ email: adminEnvEmail }),
          email: adminEnvEmail,
          password: hashed,
          role: "admin",
        });
      } else {
        return res.status(401).json({ error: "Invalid email or password" });
      }
    }
    let match = await bcrypt.compare(passwordTrimmed, admin.password);
    if (!match && adminEnvPassword && adminEnvEmail === adminEmail && passwordTrimmed === adminEnvPassword) {
      admin.password = await bcrypt.hash(adminEnvPassword, 10);
      await admin.save();
      match = true;
    }
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    // Ensure ENV admin always has full "admin" role, even if previously saved as "editor"
    const isEnvAdminUser = adminEnvEmail && admin.email === adminEnvEmail;
    let role = admin.role;
    if (isEnvAdminUser) {
      role = "admin";
      if (admin.role !== "admin") {
        admin.role = "admin";
        await admin.save();
      }
    } else {
      role = role || "editor";
      if (!admin.role) {
        admin.role = role;
        await admin.save();
      }
    }

    const token = jwt.sign({ adminId: admin._id.toString(), role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ admin: admin.toJSON(), token });
  } catch (e) {
    console.error("Admin login error:", e);
    res.status(500).json({ error: e.message || "Login failed" });
  }
});

app.get("/api/admin/me", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password");
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to get admin" });
  }
});

// ----- Admin user management (roles: admin, editor) -----
app.get("/api/admin/users", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 }).select("-password");
    res.json(admins);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load users" });
  }
});

// ----- Admin: website signup users (customers) -----
app.get("/api/admin/signup-users", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const filter = {};
    if (q) {
      filter.$or = [{ email: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }];
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).select("-password");
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load signup users" });
  }
});

app.post("/api/admin/users", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const rawName = body.name ?? body.displayName ?? body.fullName;
    const trimmedName = String(rawName ?? "").trim();
    const trimmedEmail = String(body.email || "").trim().toLowerCase();
    const trimmedPassword = String(body.password || "");
    const trimmedRole = String(body.role || "editor").trim();
    if (!trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!ADMIN_ROLES.includes(trimmedRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (trimmedPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = await Admin.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(409).json({ error: "User with this email already exists" });
    }
    const hashed = await bcrypt.hash(trimmedPassword, 10);
    const displayName = trimmedName || getAdminDisplayName({ email: trimmedEmail });
    const admin = await Admin.create({
      name: displayName,
      email: trimmedEmail,
      password: hashed,
      role: trimmedRole,
    });
    res.status(201).json(admin.toJSON());
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to create user" });
  }
});

app.patch("/api/admin/users/:id", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const existing = await Admin.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "User not found" });

    const update = {};
    if (name !== undefined) {
      const t = String(name ?? "").trim();
      const nextEmail =
        email !== undefined ? String(email).trim().toLowerCase() : existing.email;
      update.name = t || getAdminDisplayName({ email: nextEmail || existing.email });
    }
    if (email !== undefined) {
      const trimmedEmail = String(email).trim().toLowerCase();
      if (!trimmedEmail) {
        return res.status(400).json({ error: "Email cannot be empty" });
      }
      update.email = trimmedEmail;
    }
    if (role !== undefined) {
      const trimmedRole = String(role).trim();
      if (!ADMIN_ROLES.includes(trimmedRole)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      update.role = trimmedRole;
    }
    if (password !== undefined) {
      const trimmedPassword = String(password);
      if (trimmedPassword && trimmedPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      if (trimmedPassword) {
        update.password = await bcrypt.hash(trimmedPassword, 10);
      }
    }
    const admin = await Admin.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!admin) return res.status(404).json({ error: "User not found" });
    res.json(admin);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update user" });
  }
});

app.delete("/api/admin/users/:id", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.adminId) {
      return res.status(400).json({ error: "You cannot delete your own admin account" });
    }
    const target = await Admin.findById(targetId);
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.role === "admin") {
      const adminCount = await Admin.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last admin user" });
      }
    }
    await Admin.findByIdAndDelete(targetId);
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to delete user" });
  }
});

// ----- Products (subscription packs & magazines for Subscribe page) -----
const PRODUCT_CATEGORIES = ["pre-primary", "library", "classroom", "magazine"];

function slugifyProduct(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "product";
}

// Public products endpoint used by frontend Subscribe page
app.get("/api/products", async (req, res) => {
  try {
    const category = (req.query.category || "").trim();
    const filter = { active: true };
    if (category && PRODUCT_CATEGORIES.includes(category)) {
      filter.category = category;
    }
    const products = await Product.find(filter).sort({ category: 1, order: 1, createdAt: -1 }).lean();
    res.json(
      products.map((p) => ({
        id: p._id.toString(),
        category: p.category,
        name: p.name,
        slug: p.slug,
        description: p.description,
        badge: p.badge,
        tag: p.tag,
        oldPrice: p.oldPrice,
        price: p.price,
        currency: p.currency,
        imageUrl: p.imageUrl,
        order: p.order,
      }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load products" });
  }
});

// ----- Site settings (public) -----
app.get("/api/site-settings", async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings();
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load site settings" });
  }
});

// ----- Site settings (admin) -----
app.get("/api/admin/site-settings", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings();
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load site settings" });
  }
});

app.patch("/api/admin/site-settings", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const existing = await getOrCreateSiteSettings();
    const update = {
      homeHero: { ...(existing.homeHero || {}), ...(body.homeHero || {}) },
      homeLayout: { ...(existing.homeLayout || {}), ...(body.homeLayout || {}) },
      topBar: { ...(existing.topBar || {}), ...(body.topBar || {}) },
      footer: { ...(existing.footer || {}), ...(body.footer || {}) },
      contact: { ...(existing.contact || {}), ...(body.contact || {}) },
      about: { ...(existing.about || {}), ...(body.about || {}) },
    };
    const saved = await SiteSettings.findOneAndUpdate({ key: "default" }, { $set: update }, { new: true, upsert: true });
    res.json(saved.toJSON());
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update site settings" });
  }
});

// Upload hero background image from admin (returns Cloudinary URL)
app.post(
  "/api/admin/site-settings/hero-image",
  adminAuthMiddleware,
  requireAdminRole("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }
      const r = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "brainfeed-hero");
      res.status(201).json({ url: r.secure_url });
    } catch (e) {
      res.status(500).json({ error: e.message || "Failed to upload hero image" });
    }
  },
);

// Upload hero + covers for About page (admin)
app.post(
  "/api/admin/site-settings/about-image",
  adminAuthMiddleware,
  requireAdminRole("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }
      const r = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "brainfeed-about");
      res.status(201).json({ url: r.secure_url });
    } catch (e) {
      res.status(500).json({ error: e.message || "Failed to upload image" });
    }
  },
);

// Upload inline image for news/blog content editor (admin)
app.post(
  "/api/admin/posts/inline-image",
  adminAuthMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }
      const folder = "brainfeed-inline";
      const r = await uploadToCloudinary(req.file.buffer, req.file.mimetype, folder);
      res.status(201).json({ url: r.secure_url });
    } catch (e) {
      res.status(500).json({ error: e.message || "Failed to upload image" });
    }
  },
);

// Admin products CRUD
app.get("/api/admin/products", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    let products = await Product.find().sort({ category: 1, order: 1, createdAt: -1 }).lean();

    // If there are no products yet, seed a sensible default set so the admin
    // immediately sees editable items that match the Subscribe page structure.
    if (!products.length) {
      const seed = [
        {
          category: "pre-primary",
          name: "Pre Primary Combo Pack",
          description: "Annual subscription bundle designed for early-years classrooms.",
          badge: "Popular",
          tag: "Pre Primary Packs",
          price: 4500,
          oldPrice: 5200,
          currency: "INR",
          imageUrl: "",
          active: true,
          order: 1,
        },
        {
          category: "library",
          name: "School Library Pack",
          description: "Curated magazines set for school libraries.",
          badge: "Best value",
          tag: "Library Packs",
          price: 7500,
          oldPrice: 8900,
          currency: "INR",
          imageUrl: "",
          active: true,
          order: 1,
        },
        {
          category: "classroom",
          name: "Classroom Engagement Pack",
          description: "Bulk magazines for active classroom sessions.",
          badge: "",
          tag: "Classroom Packs",
          price: 6800,
          oldPrice: 7800,
          currency: "INR",
          imageUrl: "",
          active: true,
          order: 1,
        },
        {
          category: "magazine",
          name: "Brainfeed Magazine – Annual",
          description: "Annual subscription to Brainfeed Magazine.",
          badge: "New",
          tag: "Magazines",
          price: 1800,
          oldPrice: 2200,
          currency: "INR",
          imageUrl: "",
          active: true,
          order: 1,
        },
      ].map((p) => ({
        ...p,
        slug: slugifyProduct(p.name),
      }));

      await Product.insertMany(seed);
      products = await Product.find().sort({ category: 1, order: 1, createdAt: -1 }).lean();
    }

    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load products" });
  }
});

app.get("/api/admin/products/:id", adminAuthMiddleware, requireAdminRole("admin"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load product" });
  }
});

app.post(
  "/api/admin/products",
  adminAuthMiddleware,
  requireAdminRole("admin"),
  uploadProductImage.single("image"),
  async (req, res) => {
    try {
      const body = req.body || {};
      const category = String(body.category || "").trim();
      const name = String(body.name || "").trim();
      if (!category || !PRODUCT_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      if (!name) return res.status(400).json({ error: "Name is required" });
      const slug = slugifyProduct(body.slug || name);
      const price = Number(body.price) || 0;
      if (!price) return res.status(400).json({ error: "Price is required" });
      const oldPrice = Number(body.oldPrice) || 0;
      let imageUrl = String(body.imageUrl || "").trim();
      if (req.file) {
        const r = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "brainfeed-products");
        imageUrl = r.secure_url;
      }
      const product = await Product.create({
        category,
        name,
        slug,
        description: String(body.description || "").trim(),
        badge: String(body.badge || "").trim(),
        tag: String(body.tag || "").trim(),
        price,
        oldPrice,
        currency: String(body.currency || "INR").trim() || "INR",
        imageUrl,
        active: body.active !== "false",
        order: Number(body.order) || 0,
      });
      res.status(201).json(product.toJSON());
    } catch (e) {
      res.status(500).json({ error: e.message || "Failed to create product" });
    }
  }
);

app.patch(
  "/api/admin/products/:id",
  adminAuthMiddleware,
  requireAdminRole("admin"),
  uploadProductImage.single("image"),
  async (req, res) => {
    try {
      const body = req.body || {};
      const update = {};
      if (body.category !== undefined) {
        const category = String(body.category || "").trim();
        if (!PRODUCT_CATEGORIES.includes(category)) {
          return res.status(400).json({ error: "Invalid category" });
        }
        update.category = category;
      }
      if (body.name !== undefined) update.name = String(body.name || "").trim();
      if (body.slug !== undefined) {
        const raw = String(body.slug || "").trim();
        update.slug = slugifyProduct(raw || update.name);
      }
      if (body.description !== undefined) update.description = String(body.description || "").trim();
      if (body.badge !== undefined) update.badge = String(body.badge || "").trim();
      if (body.tag !== undefined) update.tag = String(body.tag || "").trim();
      if (body.price !== undefined) update.price = Number(body.price) || 0;
      if (body.oldPrice !== undefined) update.oldPrice = Number(body.oldPrice) || 0;
      if (body.currency !== undefined) update.currency = String(body.currency || "INR").trim() || "INR";
      if (body.active !== undefined) update.active = body.active !== "false";
      if (body.order !== undefined) update.order = Number(body.order) || 0;
      if (req.file) {
        const r = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "brainfeed-products");
        update.imageUrl = r.secure_url;
      } else if (body.imageUrl !== undefined) {
        update.imageUrl = String(body.imageUrl || "").trim();
      }
      const product = await Product.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
      }).lean();
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (e) {
      res.status(500).json({ error: e.message || "Failed to update product" });
    }
  }
);

app.delete(
  "/api/admin/products/:id",
  adminAuthMiddleware,
  requireAdminRole("admin"),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json({ deleted: true });
    } catch (e) {
      res.status(500).json({ error: e.message || "Failed to delete product" });
    }
  }
);

// ----- Admin subscriptions overview (for dashboard) -----
app.get("/api/admin/subscriptions", adminAuthMiddleware, async (req, res) => {
  try {
    const status = (req.query.status || "").trim();
    const filter = status ? { status } : {};
    const subs = await Subscription.find(filter).sort({ createdAt: -1 }).lean();
    res.json(
      subs.map((s) => ({
        id: s._id.toString(),
        userName: s.userName,
        email: s.email,
        source: s.source,
        planName: s.planName,
        planType: s.planType,
        total: s.total,
        currency: s.currency,
        status: s.status,
        deliveryStatus: s.deliveryStatus,
        createdAt: s.createdAt,
        deliveryExpectedAt: s.deliveryExpectedAt,
        deliveredAt: s.deliveredAt,
      }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load subscriptions" });
  }
});

app.patch("/api/admin/subscriptions/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { status, deliveryStatus, deliveryExpectedAt, deliveredAt } = req.body || {};
    const update = {};
    if (status !== undefined) update.status = String(status).trim();
    if (deliveryStatus !== undefined) update.deliveryStatus = String(deliveryStatus).trim();
    if (deliveryExpectedAt !== undefined) {
      update.deliveryExpectedAt = deliveryExpectedAt ? new Date(deliveryExpectedAt) : null;
    }
    if (deliveredAt !== undefined) {
      update.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
    }
    const sub = await Subscription.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!sub) return res.status(404).json({ error: "Subscription not found" });
    res.json({
      id: sub._id.toString(),
      userName: sub.userName,
      email: sub.email,
      source: sub.source,
      planName: sub.planName,
      planType: sub.planType,
      total: sub.total,
      currency: sub.currency,
      status: sub.status,
      deliveryStatus: sub.deliveryStatus,
      createdAt: sub.createdAt,
      deliveryExpectedAt: sub.deliveryExpectedAt,
      deliveredAt: sub.deliveredAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update subscription" });
  }
});

// ----- Admin backup (MongoDB + Cloudinary URL list; works for Atlas and self-hosted) -----
function collectCloudinaryUrls(posts) {
  const seen = new Set();
  const urls = [];
  for (const post of posts || []) {
    if (post.featuredImageUrl && !seen.has(post.featuredImageUrl)) {
      seen.add(post.featuredImageUrl);
      urls.push({ url: post.featuredImageUrl, type: "featured" });
    }
    const gallery = post.media?.gallery || [];
    for (const u of gallery) {
      if (u && !seen.has(u)) {
        seen.add(u);
        urls.push({ url: u, type: "gallery" });
      }
    }
    if (post.media?.videoUrl && post.media.videoUrl.startsWith("http")) {
      if (!seen.has(post.media.videoUrl)) {
        seen.add(post.media.videoUrl);
        urls.push({ url: post.media.videoUrl, type: "video" });
      }
    }
    if (post.media?.audioUrl && post.media.audioUrl.startsWith("http")) {
      if (!seen.has(post.media.audioUrl)) {
        seen.add(post.media.audioUrl);
        urls.push({ url: post.media.audioUrl, type: "audio" });
      }
    }
  }
  return urls;
}

app.get("/api/admin/backup", adminAuthMiddleware, async (req, res) => {
  try {
    const [users, admins, posts, pages] = await Promise.all([
      User.find().lean(),
      Admin.find().lean(),
      Post.find().lean(),
      Page.find().lean(),
    ]);
    const dbName = mongoose.connection.db?.databaseName || "Brainfeed";
    const cloudinaryUrls = collectCloudinaryUrls(posts);
    const backup = {
      backupAt: new Date().toISOString(),
      database: dbName,
      users,
      admins,
      posts,
      pages,
      cloudinaryUrls,
    };
    if (req.query.download === "1" || req.query.download === "true") {
      res.setHeader("Content-Disposition", `attachment; filename="brainfeed-backup-${Date.now()}.json"`);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(backup, null, 2));
      return;
    }
    res.json(backup);
  } catch (e) {
    res.status(500).json({ error: e.message || "Backup failed" });
  }
});

// (gallery APIs were removed)

function slugifyPost(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "post";
}

/** Tags from multipart body: JSON array string or comma-separated; deduped, capped for SEO abuse. */
function parsePostTags(raw) {
  const MAX = 80;
  const MAX_LEN = 120;
  const normalize = (arr) =>
    [...new Set(arr.map((t) => String(t).trim()).filter(Boolean).map((t) => t.slice(0, MAX_LEN)))].slice(0, MAX);
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) return normalize(raw);
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) return normalize(j);
  } catch (_) {}
  return normalize(s.split(/[,;]/));
}

// ----- Admin posts CRUD -----
const postMediaFields = [
  { name: "featuredImage", maxCount: 1 },
  { name: "gallery", maxCount: 20 },
  { name: "videoFile", maxCount: 1 },
  { name: "audioFile", maxCount: 1 },
];

app.get("/api/admin/posts", adminAuthMiddleware, async (req, res) => {
  try {
    const type = req.query.type;
    const filter = type ? { type } : {};

    // Date range filter (preferred): matches browser local calendar month.
    // GET ...?type=news&start=2026-03-01T00:00:00.000Z&end=2026-04-01T00:00:00.000Z
    const startRaw = req.query.start;
    const endRaw = req.query.end;
    if (startRaw && endRaw) {
      const start = new Date(String(startRaw));
      const end = new Date(String(endRaw));
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
        const maxMs = 2000 * 24 * 60 * 60 * 1000; // guard: ~5.5y max for admin date-range filter
        if (end.getTime() - start.getTime() <= maxMs) {
          filter.createdAt = { $gte: start, $lt: end };
        }
      }
    } else {
      // Legacy: year + month — calendar month in ADMIN_POSTS_TZ (default Asia/Kolkata) so it matches en-IN table dates
      const year = Number(req.query.year);
      const month = Number(req.query.month); // 1-12
      const tz = String(process.env.ADMIN_POSTS_TZ || "Asia/Kolkata").trim() || "Asia/Kolkata";
      if (Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12) {
        filter.$expr = {
          $and: [
            { $eq: [{ $year: { date: "$createdAt", timezone: tz } }, year] },
            { $eq: [{ $month: { date: "$createdAt", timezone: tz } }, month] },
          ],
        };
      }
    }
    const posts = await Post.find(filter).sort({ createdAt: -1 }).lean();
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load posts" });
  }
});

app.post("/api/admin/posts", adminAuthMiddleware, uploadPostMedia.fields(postMediaFields), async (req, res) => {
  try {
    const body = req.body || {};
    const type = body.type === "blog" ? "blog" : "news";
    const title = String(body.title || "").trim();
    const category = String(body.category || "").trim();
    if (!title || !category) {
      return res.status(400).json({ error: "Title and category are required" });
    }
    const slug = slugifyPost(body.slug || title);
    const folder = type === "news" ? "brainfeed-news" : "brainfeed-blog";
    let featuredImageUrl = "";
    if (req.files?.featuredImage?.[0]) {
      const r = await uploadToCloudinary(
        req.files.featuredImage[0].buffer,
        req.files.featuredImage[0].mimetype,
        folder
      );
      featuredImageUrl = r.secure_url;
    }
    const galleryUrls = [];
    if (req.files?.gallery?.length) {
      for (const file of req.files.gallery) {
        const r = await uploadToCloudinary(file.buffer, file.mimetype, folder);
        galleryUrls.push(r.secure_url);
      }
    }
    let videoUrl = String(body.videoUrl || "").trim();
    if (req.files?.videoFile?.[0]) {
      const r = await uploadToCloudinary(
        req.files.videoFile[0].buffer,
        req.files.videoFile[0].mimetype,
        folder
      );
      videoUrl = r.secure_url;
    }
    let audioUrl = String(body.audioUrl || "").trim();
    if (req.files?.audioFile?.[0]) {
      const r = await uploadToCloudinary(
        req.files.audioFile[0].buffer,
        req.files.audioFile[0].mimetype,
        folder
      );
      audioUrl = r.secure_url;
    }
    const editorInfo = {
      adminId: req.adminId || null,
      name: String(req.adminName || "").trim(),
      email: String(req.adminEmail || "").trim().toLowerCase(),
      role: String(req.adminRole || "").trim(),
    };
    const post = await Post.create({
      type,
      title,
      slug,
      subtitle: String(body.subtitle || "").trim(),
      content: String(body.content || "").trim(),
      format: ["standard", "gallery", "video", "audio", "link", "quote"].includes(body.format) ? body.format : "standard",
      category,
      featuredImageAlt: String(body.featuredImageAlt || "").trim(),
      excerpt: String(body.excerpt || "").trim(),
      readTime: String(body.readTime || "4 min read").trim(),
      metaTitle: String(body.metaTitle || "").trim(),
      metaDescription: String(body.metaDescription || "").trim(),
      focusKeyphrase: String(body.focusKeyphrase || "").trim(),
      tags: parsePostTags(body.tags),
      publishedBy: editorInfo,
      lastEditedBy: editorInfo,
      featuredImageUrl,
      media: {
        gallery: galleryUrls,
        videoUrl,
        audioUrl,
        linkUrl: String(body.linkUrl || "").trim(),
        quoteText: String(body.quoteText || "").trim(),
      },
    });
    res.status(201).json(post);
  } catch (e) {
    if (e && e.code === 11000 && e.keyPattern && e.keyPattern.slug) {
      return res
        .status(409)
        .json({ error: "Slug already exists for this type. Please choose a different slug." });
    }
    res.status(500).json({ error: e.message || "Failed to create post" });
  }
});

app.patch("/api/admin/posts/:id", adminAuthMiddleware, uploadPostMedia.fields(postMediaFields), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const body = req.body || {};
    const folder = post.type === "news" ? "brainfeed-news" : "brainfeed-blog";
    if (body.title !== undefined) post.title = String(body.title).trim();
    if (body.slug !== undefined) post.slug = slugifyPost(body.slug || post.title);
    if (body.subtitle !== undefined) post.subtitle = String(body.subtitle).trim();
    if (body.content !== undefined) post.content = String(body.content).trim();
    if (body.format !== undefined && ["standard", "gallery", "video", "audio", "link", "quote"].includes(body.format)) post.format = body.format;
    if (body.category !== undefined) post.category = String(body.category).trim();
    if (body.featuredImageAlt !== undefined) post.featuredImageAlt = String(body.featuredImageAlt).trim();
    if (body.excerpt !== undefined) post.excerpt = String(body.excerpt).trim();
    if (body.readTime !== undefined) post.readTime = String(body.readTime).trim();
    if (body.metaTitle !== undefined) post.metaTitle = String(body.metaTitle).trim();
    if (body.metaDescription !== undefined) post.metaDescription = String(body.metaDescription).trim();
    if (body.focusKeyphrase !== undefined) post.focusKeyphrase = String(body.focusKeyphrase).trim();
    if (body.tags !== undefined) post.tags = parsePostTags(body.tags);
    if (body.videoUrl !== undefined) post.media.videoUrl = String(body.videoUrl).trim();
    if (body.audioUrl !== undefined) post.media.audioUrl = String(body.audioUrl).trim();
    if (body.linkUrl !== undefined) post.media.linkUrl = String(body.linkUrl).trim();
    if (body.quoteText !== undefined) post.media.quoteText = String(body.quoteText).trim();
    const editorInfo = {
      adminId: req.adminId || null,
      name: String(req.adminName || "").trim(),
      email: String(req.adminEmail || "").trim().toLowerCase(),
      role: String(req.adminRole || "").trim(),
    };
    if (!post.publishedBy || (!post.publishedBy.name && !post.publishedBy.email)) {
      post.publishedBy = editorInfo;
    }
    post.lastEditedBy = editorInfo;
    if (req.files?.featuredImage?.[0]) {
      const r = await uploadToCloudinary(req.files.featuredImage[0].buffer, req.files.featuredImage[0].mimetype, folder);
      post.featuredImageUrl = r.secure_url;
    }
    /* Clear gallery *before* appending new uploads (admin “remove all + add new” in one save). */
    if (body.galleryRemove === "true" || body.clearGallery === "true") post.media.gallery = [];
    if (req.files?.gallery?.length) {
      const newUrls = [];
      for (const file of req.files.gallery) {
        const r = await uploadToCloudinary(file.buffer, file.mimetype, folder);
        newUrls.push(r.secure_url);
      }
      post.media.gallery = post.media.gallery.concat(newUrls);
    }
    await post.save();
    res.json(post);
  } catch (e) {
    if (e && e.code === 11000 && e.keyPattern && e.keyPattern.slug) {
      return res
        .status(409)
        .json({ error: "Slug already exists for this type. Please choose a different slug." });
    }
    res.status(500).json({ error: e.message || "Failed to update post" });
  }
});

app.get("/api/admin/posts/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load post" });
  }
});

app.delete("/api/admin/posts/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to delete post" });
  }
});

// ----- Admin pages CRUD (WordPress-style static pages) -----
function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "page";
}

app.get("/api/admin/pages", adminAuthMiddleware, async (req, res) => {
  try {
    const pages = await Page.find().sort({ order: 1, title: 1 }).lean();
    res.json(pages);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load pages" });
  }
});

app.post("/api/admin/pages", adminAuthMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required" });
    let slug = String(body.slug || "").trim() || slugify(title);
    slug = slugify(slug) || "page";
    const existing = await Page.findOne({ slug });
    if (existing) {
      let suffix = 1;
      while (await Page.findOne({ slug: slug + "-" + suffix })) suffix++;
      slug = slug + "-" + suffix;
    }
    const parentId = body.parent ? body.parent : null;
    const order = Number(body.order) ?? 0;
    const heroImageUrl = String(body.heroImageUrl || "").trim();
    const heroImageAlt = String(body.heroImageAlt || "").trim();
    const aboutCovers = {
      main: String(body.aboutCoverMain || "").trim(),
      primary2: String(body.aboutCoverPrimary2 || "").trim(),
      primary1: String(body.aboutCoverPrimary1 || "").trim(),
      junior: String(body.aboutCoverJunior || "").trim(),
    };
    const page = await Page.create({
      title,
      slug,
      content: String(body.content || "").trim(),
      parent: parentId || null,
      order,
      heroImageUrl,
      heroImageAlt,
      aboutCovers,
    });
    res.status(201).json(page);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to create page" });
  }
});

app.get("/api/admin/pages/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id).lean();
    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json(page);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load page" });
  }
});

app.patch("/api/admin/pages/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ error: "Page not found" });
    const body = req.body || {};
    if (body.title !== undefined) page.title = String(body.title).trim();
    if (body.slug !== undefined) {
      const raw = String(body.slug).trim();
      page.slug = raw ? slugify(raw) : slugify(page.title);
    }
    if (body.content !== undefined) page.content = String(body.content).trim();
    if (body.parent !== undefined) page.parent = body.parent || null;
    if (body.order !== undefined) page.order = Number(body.order) ?? 0;
    if (body.heroImageUrl !== undefined) page.heroImageUrl = String(body.heroImageUrl || "").trim();
    if (body.heroImageAlt !== undefined) page.heroImageAlt = String(body.heroImageAlt || "").trim();
    if (
      body.aboutCoverMain !== undefined ||
      body.aboutCoverPrimary2 !== undefined ||
      body.aboutCoverPrimary1 !== undefined ||
      body.aboutCoverJunior !== undefined
    ) {
      page.aboutCovers = {
        ...(page.aboutCovers || {}),
        ...(body.aboutCoverMain !== undefined ? { main: String(body.aboutCoverMain || "").trim() } : {}),
        ...(body.aboutCoverPrimary2 !== undefined
          ? { primary2: String(body.aboutCoverPrimary2 || "").trim() }
          : {}),
        ...(body.aboutCoverPrimary1 !== undefined
          ? { primary1: String(body.aboutCoverPrimary1 || "").trim() }
          : {}),
        ...(body.aboutCoverJunior !== undefined ? { junior: String(body.aboutCoverJunior || "").trim() } : {}),
      };
    }
    await page.save();
    res.json(page);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update page" });
  }
});

app.delete("/api/admin/pages/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to delete page" });
  }
});

// ----- Admin flipbooks (PDF magazine / flipbook viewer) -----
app.get("/api/admin/flipbooks", adminAuthMiddleware, async (req, res) => {
  try {
    const list = await Flipbook.find().sort({ updatedAt: -1 }).lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to list flipbooks" });
  }
});

app.get("/api/admin/flipbooks/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const fb = await Flipbook.findById(req.params.id).lean();
    if (!fb) return res.status(404).json({ error: "Flipbook not found" });
    res.json(fb);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load flipbook" });
  }
});

app.post("/api/admin/flipbooks", adminAuthMiddleware, uploadFlipbookPdf.single("pdf"), async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required" });
    let slug = String(body.slug || "").trim() || slugify(title);
    slug = slugify(slug) || "flipbook";
    const existing = await Flipbook.findOne({ slug });
    if (existing) {
      let suffix = 1;
      while (await Flipbook.findOne({ slug: slug + "-" + suffix })) suffix++;
      slug = slug + "-" + suffix;
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "PDF file is required (field name: pdf)" });
    }
    const r = await uploadPdfToCloudinary(req.file.buffer, req.file.mimetype, "brainfeed-flipbooks");
    const pdfUrl = r.secure_url || r.url;
    const fb = await Flipbook.create({
      title,
      slug,
      pdfUrl,
      published: body.published !== undefined ? Boolean(body.published) : true,
    });
    res.status(201).json(fb);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to create flipbook" });
  }
});

app.patch("/api/admin/flipbooks/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const fb = await Flipbook.findById(req.params.id);
    if (!fb) return res.status(404).json({ error: "Flipbook not found" });
    const body = req.body || {};
    if (body.title !== undefined) fb.title = String(body.title).trim();
    if (body.slug !== undefined) {
      const raw = String(body.slug).trim();
      let candidate = raw ? slugify(raw) : slugify(fb.title);
      if (!candidate) candidate = "flipbook";
      let finalSlug = candidate;
      let n = 0;
      while (await Flipbook.findOne({ slug: finalSlug, _id: { $ne: fb._id } })) {
        n += 1;
        finalSlug = `${candidate}-${n}`;
      }
      fb.slug = finalSlug;
    }
    if (body.published !== undefined) fb.published = Boolean(body.published);
    await fb.save();
    res.json(fb);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update flipbook" });
  }
});

app.post(
  "/api/admin/flipbooks/:id/pdf",
  adminAuthMiddleware,
  uploadFlipbookPdf.single("pdf"),
  async (req, res) => {
    try {
      const fb = await Flipbook.findById(req.params.id);
      if (!fb) return res.status(404).json({ error: "Flipbook not found" });
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "PDF file is required (field name: pdf)" });
      }
      const r = await uploadPdfToCloudinary(req.file.buffer, req.file.mimetype, "brainfeed-flipbooks");
      fb.pdfUrl = r.secure_url || r.url;
      await fb.save();
      res.json(fb);
    } catch (e) {
      res.status(500).json({ error: e.message || "Failed to upload PDF" });
    }
  }
);

app.delete("/api/admin/flipbooks/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const fb = await Flipbook.findByIdAndDelete(req.params.id);
    if (!fb) return res.status(404).json({ error: "Flipbook not found" });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to delete flipbook" });
  }
});

// ----- Public flipbooks -----
app.get("/api/flipbooks", async (req, res) => {
  try {
    const list = await Flipbook.find({ published: true })
      .sort({ updatedAt: -1 })
      .select("title slug updatedAt")
      .lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to list flipbooks" });
  }
});

app.get("/api/flipbooks/slug/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim();
    const fb = await Flipbook.findOne({ slug, published: true }).lean();
    if (!fb) return res.status(404).json({ error: "Flipbook not found" });
    res.json({ title: fb.title, slug: fb.slug, pdfUrl: fb.pdfUrl });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load flipbook" });
  }
});

// ----- Public pages (by slug for menus and single page view) -----
app.get("/api/pages", async (req, res) => {
  try {
    const pages = await Page.find().sort({ order: 1, title: 1 }).select("title slug parent order").lean();
    res.json(pages);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load pages" });
  }
});

app.get("/api/pages/slug/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim();
    let page = await Page.findOne({ slug }).lean();

    // If About page is requested but doesn't exist yet, seed it with default content
    if (!page && slug === "about") {
      const defaultContent = `
<p>Brainfeed is an educational media house empowering children in their journey of childhood, literacy and numeracy development — and helping educators teach out-of-curriculum skills and concepts.</p>
<p>Our children's editions ignite young minds and nurture curiosity with content that raises questions and stimulates interest. The educator edition connects thousands of school leaders with objective insights to see what's now and next.</p>
`.trim();

      const created = await Page.create({
        title: "About Brainfeed",
        slug: "about",
        content: defaultContent,
        parent: null,
        order: 0,
      });
      page = created.toJSON();
    }

    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json(page);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load page" });
  }
});

// ----- Public posts (News & Blog) -----
app.get("/api/posts/news", async (req, res) => {
  try {
    const posts = await Post.find({ type: "news" }).sort({ createdAt: -1 }).lean();
    res.json(posts.map((p) => ({ ...p, id: p._id.toString(), imageUrl: p.featuredImageUrl })));
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load news" });
  }
});

app.get("/api/posts/blogs", async (req, res) => {
  try {
    const posts = await Post.find({ type: "blog" }).sort({ createdAt: -1 }).lean();
    res.json(posts.map((p) => ({ ...p, id: p._id.toString(), imageUrl: p.featuredImageUrl })));
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load blogs" });
  }
});

app.get("/api/posts/news/:id", async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, type: "news" },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json({
      ...post,
      id: post._id.toString(),
      imageUrl: post.featuredImageUrl,
      imageAlt: post.featuredImageAlt || "",
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load article" });
  }
});

app.get("/api/posts/blogs/:id", async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, type: "blog" },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json({ ...post, id: post._id.toString(), imageUrl: post.featuredImageUrl });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load post" });
  }
});

app.get("/api/articles", async (req, res) => {
  try {
    const posts = await Post.find({ type: "news" }).sort({ createdAt: -1 }).lean();
    res.json(
      posts.map((p) => ({
        id: p._id.toString(),
        imageUrl: p.featuredImageUrl,
        imageAlt: p.featuredImageAlt || "",
        title: p.title,
        excerpt: p.excerpt || p.subtitle || "",
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
        category: p.category,
        readTime: p.readTime || "4 min read",
      }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load articles" });
  }
});

// 404 – set CORS so cross-origin clients get a valid response
app.use((req, res) => {
  setCorsHeaders(req, res);
  res.status(404).json({ error: "Not found" });
});

// Global error handler – always send valid CORS so browser does not block
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  setCorsHeaders(req, res);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || "Internal server error" });
  } else {
    next(err);
  }
});

function startServer() {
  const host = process.env.HOST || "0.0.0.0";
  app.listen(PORT, host, () => {
    console.log(`Brainfeed API running on http://${host}:${PORT}`);
    if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "brainfeed-jwt-secret-change-in-production")) {
      console.warn("WARNING: Set JWT_SECRET in production (e.g. on Railway) for secure tokens.");
    }
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.warn("Admin login: ADMIN_EMAIL or ADMIN_PASSWORD not set in .env – admin login may fail.");
    } else {
      console.log("Admin login: credentials loaded from .env");
    }
  });
}

// Listen after all routes are registered (Railway health checks + no race on first request)
startServer();
