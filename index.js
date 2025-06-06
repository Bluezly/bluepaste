const express = require("express");
const { MongoClient } = require("mongodb");
const { nanoid } = require("nanoid");
const hljs = require("highlight.js");
const sanitizeHtml = require("sanitize-html");
const rateLimit = require("express-rate-limit");
const QRCode = require("qrcode");
const compression = require("compression");
const helmet = require("helmet");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
require("dotenv").config();
s
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URIS = process.env.MONGO_URIS?.split(",") || [
  "mongodb://localhost:27017",
];
const MAX_PASTE_SIZE = parseInt(process.env.MAX_PASTE_SIZE) || 1048576; // 1MB
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 50;

// Global variables for database management
let mongoClients = [];
let metaDb = null;
let dbStatus = {}; // Track read-only status of databases

// Programming languages dictionary with their beautiful names
const PROGRAMMING_LANGUAGES = {
  // Web Technologies
  html: { name: "HTML", category: "Web", icon: "🌐" },
  css: { name: "CSS", category: "Web", icon: "🎨" },
  javascript: { name: "JavaScript", category: "Web", icon: "💛" },
  typescript: { name: "TypeScript", category: "Web", icon: "🔷" },
  jsx: { name: "JSX (React)", category: "Web", icon: "⚛️" },
  tsx: { name: "TSX (React)", category: "Web", icon: "⚛️" },
  vue: { name: "Vue.js", category: "Web", icon: "💚" },
  angular: { name: "Angular", category: "Web", icon: "🅰️" },
  svelte: { name: "Svelte", category: "Web", icon: "🧡" },
  php: { name: "PHP", category: "Web", icon: "🐘" },
  asp: { name: "ASP.NET", category: "Web", icon: "🔵" },

  // Backend & Systems
  python: { name: "Python", category: "Backend", icon: "🐍" },
  java: { name: "Java", category: "Backend", icon: "☕" },
  csharp: { name: "C#", category: "Backend", icon: "🔷" },
  cpp: { name: "C++", category: "Systems", icon: "⚙️" },
  c: { name: "C", category: "Systems", icon: "⚡" },
  go: { name: "Go", category: "Backend", icon: "🐹" },
  rust: { name: "Rust", category: "Systems", icon: "🦀" },
  kotlin: { name: "Kotlin", category: "Backend", icon: "🟣" },
  scala: { name: "Scala", category: "Backend", icon: "🔴" },
  swift: { name: "Swift", category: "Mobile", icon: "🍎" },
  objectivec: { name: "Objective-C", category: "Mobile", icon: "📱" },
  dart: { name: "Dart", category: "Mobile", icon: "🎯" },

  // Functional Programming
  haskell: { name: "Haskell", category: "Functional", icon: "🧮" },
  elm: { name: "Elm", category: "Functional", icon: "🌳" },
  clojure: { name: "Clojure", category: "Functional", icon: "🟢" },
  erlang: { name: "Erlang", category: "Functional", icon: "📡" },
  elixir: { name: "Elixir", category: "Functional", icon: "💜" },
  fsharp: { name: "F#", category: "Functional", icon: "🔵" },
  ocaml: { name: "OCaml", category: "Functional", icon: "🐪" },
  lisp: { name: "Lisp", category: "Functional", icon: "🔗" },
  scheme: { name: "Scheme", category: "Functional", icon: "🎭" },

  // Dynamic Languages
  ruby: { name: "Ruby", category: "Dynamic", icon: "💎" },
  perl: { name: "Perl", category: "Dynamic", icon: "🐪" },
  lua: { name: "Lua", category: "Dynamic", icon: "🌙" },
  r: { name: "R", category: "Data Science", icon: "📊" },
  julia: { name: "Julia", category: "Data Science", icon: "🔬" },
  matlab: { name: "MATLAB", category: "Data Science", icon: "📈" },

  // Shell & Scripting
  bash: { name: "Bash", category: "Shell", icon: "💻" },
  zsh: { name: "Zsh", category: "Shell", icon: "🐚" },
  fish: { name: "Fish Shell", category: "Shell", icon: "🐠" },
  powershell: { name: "PowerShell", category: "Shell", icon: "💙" },
  dos: { name: "DOS Batch", category: "Shell", icon: "📁" },

  // Database & Query
  sql: { name: "SQL", category: "Database", icon: "🗄️" },
  mysql: { name: "MySQL", category: "Database", icon: "🐬" },
  postgresql: { name: "PostgreSQL", category: "Database", icon: "🐘" },
  mongodb: { name: "MongoDB", category: "Database", icon: "🍃" },
  redis: { name: "Redis", category: "Database", icon: "🔴" },

  // Markup & Data
  xml: { name: "XML", category: "Markup", icon: "📄" },
  json: { name: "JSON", category: "Data", icon: "📋" },
  yaml: { name: "YAML", category: "Data", icon: "📝" },
  toml: { name: "TOML", category: "Data", icon: "⚙️" },
  markdown: { name: "Markdown", category: "Markup", icon: "📝" },
  latex: { name: "LaTeX", category: "Markup", icon: "📄" },

  // Assembly & Low Level
  armasm: { name: "ARM Assembly", category: "Assembly", icon: "⚙️" },
  x86asm: { name: "x86 Assembly", category: "Assembly", icon: "🔧" },
  nasm: { name: "NASM", category: "Assembly", icon: "⚡" },

  // Game Development
  glsl: { name: "GLSL", category: "Graphics", icon: "🎮" },
  hlsl: { name: "HLSL", category: "Graphics", icon: "🎯" },
  gdscript: { name: "GDScript", category: "Game Dev", icon: "🎮" },

  // Configuration & DevOps
  dockerfile: { name: "Dockerfile", category: "DevOps", icon: "🐳" },
  nginx: { name: "Nginx Config", category: "DevOps", icon: "🌐" },
  apache: { name: "Apache Config", category: "DevOps", icon: "🪶" },
  jenkins: { name: "Jenkins", category: "DevOps", icon: "⚙️" },
  terraform: { name: "Terraform", category: "DevOps", icon: "🏗️" },
  ansible: { name: "Ansible", category: "DevOps", icon: "🔄" },

  // Other Languages
  fortran: { name: "Fortran", category: "Scientific", icon: "🧪" },
  cobol: { name: "COBOL", category: "Legacy", icon: "🏛️" },
  pascal: { name: "Pascal", category: "Educational", icon: "🎓" },
  delphi: { name: "Delphi", category: "Desktop", icon: "🔷" },
  vbnet: { name: "VB.NET", category: "Desktop", icon: "💙" },
  actionscript: { name: "ActionScript", category: "Flash", icon: "⚡" },
  crystal: { name: "Crystal", category: "Modern", icon: "💎" },
  nim: { name: "Nim", category: "Modern", icon: "👑" },
  zig: { name: "Zig", category: "Systems", icon: "⚡" },
  v: { name: "V", category: "Modern", icon: "✌️" },
  odin: { name: "Odin", category: "Systems", icon: "🗲" },

  // Esoteric & Fun
  brainfuck: { name: "Brainfuck", category: "Esoteric", icon: "🧠" },
  whitespace: { name: "Whitespace", category: "Esoteric", icon: "⬜" },
  lolcode: { name: "LOLCODE", category: "Esoteric", icon: "😸" },

  // Default
  plaintext: { name: "Plain Text", category: "Text", icon: "📄" },
};

// Security and middleware setup
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      },
    },
  })
);

app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.static("public"));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/create", limiter);

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

// Utility functions
function detectLanguage(content) {
  // Improved language detection based on keywords and patterns
  const patterns = {
    python: [
      /def\s+\w+\s*\(/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /if\s+__name__\s*==\s*["']__main__["']/,
      /print\s*\(/,
    ],
    javascript: [
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /console\.log\s*\(/,
      /=>\s*{?/,
    ],
    typescript: [
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /:\s*(string|number|boolean)/,
      /export\s+(interface|type|class)/,
    ],
    java: [
      /public\s+class\s+\w+/,
      /public\s+static\s+void\s+main/,
      /System\.out\.print/,
      /import\s+java\./,
    ],
    csharp: [
      /using\s+System/,
      /public\s+class\s+\w+/,
      /Console\.Write/,
      /namespace\s+\w+/,
    ],
    cpp: [/#include\s*<.*>/, /std::/, /cout\s*<</, /int\s+main\s*\(/],
    c: [/#include\s*<.*\.h>/, /printf\s*\(/, /int\s+main\s*\(/, /malloc\s*\(/],
    php: [/<\?php/, /echo\s+/, /\$\w+/, /function\s+\w+\s*\(/],
    ruby: [/def\s+\w+/, /puts\s+/, /require\s+/, /class\s+\w+/],
    go: [/package\s+main/, /func\s+main\s*\(\)/, /import\s+\(/, /fmt\.Print/],
    rust: [/fn\s+main\s*\(\)/, /let\s+mut/, /println!\s*\(/, /use\s+std::/],
    swift: [/func\s+\w+\s*\(/, /var\s+\w+/, /let\s+\w+/, /print\s*\(/],
    kotlin: [/fun\s+main\s*\(/, /fun\s+\w+\s*\(/, /val\s+\w+/, /var\s+\w+/],
    html: [/<html[^>]*>/, /<head[^>]*>/, /<body[^>]*>/, /<div[^>]*>/],
    css: [/\w+\s*{[^}]*}/, /@media\s*\(/, /\.[\w-]+\s*{/, /#[\w-]+\s*{/],
    sql: [
      /SELECT\s+.*FROM/i,
      /INSERT\s+INTO/i,
      /CREATE\s+TABLE/i,
      /UPDATE\s+.*SET/i,
    ],
    json: [/^\s*{/, /^\s*\[/, /"[\w-]+"\s*:/, /:\s*"[^"]*"/],
    yaml: [/^[\w-]+:\s*/, /^\s*-\s+/, /---\s*$/, /\.\.\.\s*$/],
    bash: [/#!\/bin\/bash/, /echo\s+/, /if\s*\[\s*/, /for\s+\w+\s+in/],
    dockerfile: [/FROM\s+\w+/, /RUN\s+/, /COPY\s+/, /WORKDIR\s+/],
    markdown: [/^#+\s+/, /\*\*.*\*\*/, /\[.*\]\(.*\)/, /```/],
  };

  // Search for patterns in content
  for (const [lang, regexes] of Object.entries(patterns)) {
    let matches = 0;
    for (const regex of regexes) {
      if (regex.test(content)) {
        matches++;
      }
    }
    if (matches >= 2) {
      // If multiple patterns match
      return lang;
    }
  }

  // Use highlight.js as fallback
  const result = hljs.highlightAuto(content.substring(0, 2000));
  return result.language || "plaintext";
}

function detectTextDirection(text) {
  const rtlChars =
    /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlChars.test(text) ? "rtl" : "ltr";
}

function sanitizeContent(content) {
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: function (text) {
      return text;
    },
  });
}

function getLanguagesByCategory() {
  const categories = {};

  for (const [key, lang] of Object.entries(PROGRAMMING_LANGUAGES)) {
    if (!categories[lang.category]) {
      categories[lang.category] = [];
    }
    categories[lang.category].push({
      key: key,
      name: lang.name,
      icon: lang.icon,
    });
  }

  // Sort languages within each category
  for (const category in categories) {
    categories[category].sort((a, b) => a.name.localeCompare(b.name));
  }

  return categories;
}

function getPopularLanguages() {
  const popular = [
    "javascript",
    "python",
    "java",
    "typescript",
    "csharp",
    "php",
    "cpp",
    "c",
    "go",
    "rust",
    "html",
    "css",
    "sql",
    "json",
    "bash",
    "markdown",
  ];

  return popular.map((key) => ({
    key: key,
    name: PROGRAMMING_LANGUAGES[key]?.name || key,
    icon: PROGRAMMING_LANGUAGES[key]?.icon || "📄",
  }));
}

async function initializeDatabases() {
  console.log("Initializing database connections...");

  for (let i = 0; i < MONGO_URIS.length; i++) {
    try {
      const client = new MongoClient(MONGO_URIS[i], {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await client.connect();
      await client.db("admin").command({ ping: 1 });

      mongoClients.push(client);
      dbStatus[MONGO_URIS[i]] = { readOnly: false, lastChecked: Date.now() };

      console.log(`Connected to MongoDB at ${MONGO_URIS[i]}`);

      // Initialize meta database on first URI
      if (i === 0) {
        metaDb = client.db("bluepaste_meta");
        await metaDb
          .collection("paste_mappings")
          .createIndex({ paste_id: 1 }, { unique: true });
        await metaDb.collection("paste_mappings").createIndex({ timestamp: 1 });
      }
    } catch (error) {
      console.error(
        `Failed to connect to MongoDB at ${MONGO_URIS[i]}:`,
        error.message
      );
      dbStatus[MONGO_URIS[i]] = { readOnly: true, lastChecked: Date.now() };
    }
  }

  if (mongoClients.length === 0) {
    throw new Error("No MongoDB connections available");
  }
}

async function getWritableDatabase() {
  for (let i = 0; i < mongoClients.length; i++) {
    const uri = MONGO_URIS[i];
    if (!dbStatus[uri]?.readOnly) {
      try {
        const client = mongoClients[i];
        const db = client.db("bluepaste_data_" + i);
        return { client, db, uri, index: i };
      } catch (error) {
        console.error(`Database ${uri} unavailable:`, error.message);
        dbStatus[uri] = { readOnly: true, lastChecked: Date.now() };
      }
    }
  }
  throw new Error("No writable databases available");
}

async function findPasteDatabase(pasteId) {
  try {
    const mapping = await metaDb
      .collection("paste_mappings")
      .findOne({ paste_id: pasteId });
    if (!mapping) return null;

    const clientIndex = MONGO_URIS.indexOf(mapping.mongo_uri);
    if (clientIndex === -1 || clientIndex >= mongoClients.length) return null;

    const client = mongoClients[clientIndex];
    const db = client.db(mapping.db_name);

    return { client, db, mapping };
  } catch (error) {
    console.error("Error finding paste database:", error);
    return null;
  }
}

async function createPaste(content, language = null) {
  const pasteId = nanoid(12);
  const detectedLang = language || detectLanguage(content);
  const textDirection = detectTextDirection(content);
  const timestamp = new Date();

  try {
    const { client, db, uri, index } = await getWritableDatabase();

    const paste = {
      paste_id: pasteId,
      content: content,
      language: detectedLang,
      text_direction: textDirection,
      length: content.length,
      timestamp: timestamp,
      views: 0,
    };

    await db.collection("pastes").insertOne(paste);

    // Store mapping in meta database
    await metaDb.collection("paste_mappings").insertOne({
      paste_id: pasteId,
      mongo_uri: uri,
      db_name: "bluepaste_data_" + index,
      timestamp: timestamp,
    });

    return { pasteId, language: detectedLang, textDirection };
  } catch (error) {
    if (error.code === 14 || error.message.includes("storage")) {
      // Database full, mark as read-only
      const { uri } = await getWritableDatabase();
      dbStatus[uri] = { readOnly: true, lastChecked: Date.now() };
      return await createPaste(content, language); // Retry with next database
    }
    throw error;
  }
}

async function getPaste(pasteId) {
  const dbInfo = await findPasteDatabase(pasteId);
  if (!dbInfo) return null;

  const { db } = dbInfo;
  const paste = await db.collection("pastes").findOne({ paste_id: pasteId });

  if (paste) {
    // Increment view count
    await db
      .collection("pastes")
      .updateOne({ paste_id: pasteId }, { $inc: { views: 1 } });
  }

  return paste;
}

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    title: "BluePaste - Anonymous Paste Sharing",
    languagesByCategory: getLanguagesByCategory(),
    popularLanguages: getPopularLanguages(),
    languages: hljs.listLanguages(), // This is what your template expects
    maxSize: MAX_PASTE_SIZE,
  });
});

app.post("/create", async (req, res) => {
  try {
    let { content, language, title } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Content cannot be empty" });
    }

    if (content.length > MAX_PASTE_SIZE) {
      return res.status(400).json({
        error: `Content too large. Maximum size: ${MAX_PASTE_SIZE} characters`,
      });
    }

    // Sanitize content
    content = sanitizeContent(content);

    const {
      pasteId,
      language: detectedLang,
      textDirection,
    } = await createPaste(content, language);

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.json({
      success: true,
      pasteId: pasteId,
      url: `${baseUrl}/view/${pasteId}`,
      rawUrl: `${baseUrl}/raw/${pasteId}`,
      language: detectedLang,
      textDirection: textDirection,
      languageInfo: PROGRAMMING_LANGUAGES[detectedLang] || {
        name: detectedLang,
        icon: "📄",
      },
    });
  } catch (error) {
    console.error("Error creating paste:", error);
    res.status(500).json({ error: "Failed to create paste" });
  }
});

app.get("/view/:id", async (req, res) => {
  try {
    const pasteId = req.params.id;
    const paste = await getPaste(pasteId);

    if (!paste) {
      return res.status(404).render("error", {
        title: "Paste Not Found",
        error: "The requested paste could not be found.",
      });
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(
      `${req.protocol}://${req.get("host")}/view/${pasteId}`
    );

    // Highlight code
    let highlightedContent;
    try {
      if (paste.language && paste.language !== "plaintext") {
        highlightedContent = hljs.highlight(paste.content, {
          language: paste.language,
        }).value;
      } else {
        highlightedContent = hljs.highlightAuto(paste.content).value;
      }
    } catch (error) {
      highlightedContent = hljs.highlightAuto(paste.content).value;
    }

    const languageInfo = PROGRAMMING_LANGUAGES[paste.language] || {
      name: paste.language,
      category: "Other",
      icon: "📄",
    };

    res.render("view", {
      title: `${languageInfo.icon} ${languageInfo.name} - Paste ${pasteId} - BluePaste`,
      paste: paste,
      highlightedContent: highlightedContent,
      qrCode: qrCode,
      pasteId: pasteId,
      shareUrl: `${req.protocol}://${req.get("host")}/view/${pasteId}`,
      languageInfo: languageInfo,
    });
  } catch (error) {
    console.error("Error viewing paste:", error);
    res.status(500).render("error", {
      title: "Error",
      error: "An error occurred while loading the paste.",
    });
  }
});

app.get("/raw/:id", async (req, res) => {
  try {
    const pasteId = req.params.id;
    const paste = await getPaste(pasteId);

    if (!paste) {
      return res.status(404).send("Paste not found");
    }

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(paste.content);
  } catch (error) {
    console.error("Error getting raw paste:", error);
    res.status(500).send("Error loading paste");
  }
});

app.get("/json/:id", async (req, res) => {
  try {
    const pasteId = req.params.id;
    const paste = await getPaste(pasteId);

    if (!paste) {
      return res.status(404).json({ error: "Paste not found" });
    }

    const languageInfo = PROGRAMMING_LANGUAGES[paste.language] || {
      name: paste.language,
      category: "Other",
      icon: "📄",
    };

    res.json({
      paste_id: paste.paste_id,
      content: paste.content,
      language: paste.language,
      language_info: languageInfo,
      text_direction: paste.text_direction,
      length: paste.length,
      timestamp: paste.timestamp,
      views: paste.views,
    });
  } catch (error) {
    console.error("Error getting paste JSON:", error);
    res.status(500).json({ error: "Error loading paste" });
  }
});

// API endpoint for searching languages
app.get("/api/languages/search", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";

  if (!query) {
    return res.json(getPopularLanguages());
  }

  const results = [];
  for (const [key, lang] of Object.entries(PROGRAMMING_LANGUAGES)) {
    if (
      lang.name.toLowerCase().includes(query) ||
      key.toLowerCase().includes(query) ||
      lang.category.toLowerCase().includes(query)
    ) {
      results.push({
        key: key,
        name: lang.name,
        icon: lang.icon,
        category: lang.category,
      });
    }
  }

  // Sort results by relevance
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase().startsWith(query) ? 0 : 1;
    const bExact = b.name.toLowerCase().startsWith(query) ? 0 : 1;
    return aExact - bExact || a.name.localeCompare(b.name);
  });

  res.json(results.slice(0, 20)); // First 20 results
});

// API endpoint for getting specific language info
app.get("/api/languages/:lang", (req, res) => {
  const lang = req.params.lang;
  const langInfo = PROGRAMMING_LANGUAGES[lang];

  if (!langInfo) {
    return res.status(404).json({ error: "Language not found" });
  }

  res.json({
    key: lang,
    name: langInfo.name,
    category: langInfo.category,
    icon: langInfo.icon,
    supported: hljs.getLanguage(lang) ? true : false,
  });
});
app.get("/health", async (req, res) => {
  const status = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    // بدل ما نكشف حالة قواعد البيانات بالتفصيل، نعطي حالة عامة فقط
    databases: "hidden",
    supported_languages: Object.keys(PROGRAMMING_LANGUAGES).length,
    hljs_languages: hljs.listLanguages().length,
  };

  // نتحقق فعلياً من الاتصال، لكن ما نُظهر التفاصيل
  let allConnected = true;
  for (let i = 0; i < MONGO_URIS.length; i++) {
    const uri = MONGO_URIS[i];
    try {
      if (mongoClients[i]) {
        await mongoClients[i].db("admin").command({ ping: 1 });
      } else {
        allConnected = false;
      }
    } catch (error) {
      allConnected = false;
    }
  }

  // لو فيه مشكلة بالاتصال نغير الحالة العامة
  if (!allConnected) {
    status.status = "degraded";
  }

  res.json(status);
});

// Statistics endpoint
app.get("/stats", async (req, res) => {
  try {
    const stats = {
      total_languages: Object.keys(PROGRAMMING_LANGUAGES).length,
      categories: {},
      popular_languages: getPopularLanguages(),
      recent_pastes: 0,
    };

    // Category statistics
    for (const [key, lang] of Object.entries(PROGRAMMING_LANGUAGES)) {
      stats.categories[lang.category] =
        (stats.categories[lang.category] || 0) + 1;
    }

    // Database statistics
    if (metaDb) {
      try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        stats.recent_pastes = await metaDb
          .collection("paste_mappings")
          .countDocuments({ timestamp: { $gte: oneDayAgo } });
      } catch (error) {
        console.error("Error getting paste stats:", error);
      }
    }

    res.json(stats);
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Error loading statistics" });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    error: "The requested page could not be found.",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).render("error", {
    title: "Server Error",
    error: "An internal server error occurred.",
  });
});

// Server startup
async function startServer() {
  try {
    await initializeDatabases();

    app.listen(PORT, () => {
      console.log(`🚀 BluePaste server running on port ${PORT}`);
      console.log(`📊 Connected to ${mongoClients.length} database(s)`);
      console.log(
        `🌍 Supporting ${
          Object.keys(PROGRAMMING_LANGUAGES).length
        } programming languages`
      );
      console.log(
        `⚡ highlight.js supports ${hljs.listLanguages().length} languages`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down gracefully...");

  for (const client of mongoClients) {
    await client.close();
  }

  process.exit(0);
});

startServer();
