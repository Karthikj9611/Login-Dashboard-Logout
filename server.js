const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// DB Connect
mongoose.connect("mongodb+srv://karthikj:karthikj@cluster0.hkz6yzz.mongodb.net/loginDB?retryWrites=true&w=majority")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// User Schema
const User = mongoose.model("User", {
  username: String,
  password: String
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: true
}));

// Routes

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    password: hashedPassword
  });

  await user.save();
  res.send("✅ Registered! <a href='/'>Login</a>");
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // 1. Check user
  const user = await User.findOne({ username });

  if (!user) {
    return res.send("❌ User not found");
  }

  // 2. Compare password (DEFINE FIRST)
  const isMatch = await bcrypt.compare(password, user.password);

  // 3. THEN check
  if (!isMatch) {
    return res.send("❌ Wrong password");
  }

  // 4. Success
  req.session.user = username;
  res.send("✅ Login successful");
});

// Dashboard (Protected)
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

