const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Upload setup ───────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.json({ filename: req.file.filename, url: `/photos/${req.file.filename}` });
});
app.use('/photos', express.static(uploadDir));
app.get('/photos', (req, res) => {
  const files = fs.readdirSync(uploadDir).map(f => ({ filename: f, url: `/photos/${f}` }));
  res.json(files);
});

// ─── Users setup ────────────────────────────────────────────
const USERS_FILE = path.join(__dirname, 'users.json');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const users = readUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
    return res.status(409).json({ error: 'Username already taken' });

  const user = { id: Date.now().toString(), username, password };
  users.push(user);
  writeUsers(users);
  res.json({ id: user.id, username: user.username });
});

// Login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  res.json({ id: user.id, username: user.username });
});

app.listen(3001, '0.0.0.0', () => console.log('Server running on port 3001'));