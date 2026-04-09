const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------ MongoDB Connection ------------------
//mongoose.connect("mongodb://127.0.0.1:27017/loginDB")
mongoose.connect("mongodb+srv://karthikj:karthikj@cluster0.hkz6yzz.mongodb.net/loginDB?retryWrites=true&w=majority")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// ------------------ User Schema ------------------
const User = mongoose.model("User", {
  username: String,
  password: String,
  phone: String
});

// ------------------ Middleware ------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: true
}));

// ------------------ Routes ------------------

// Login Page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Register Page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// ------------------ Registration ------------------
app.post("/register", async (req, res) => {
  try {
    console.log("📌 Registration Request Body:", req.body);

    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
      console.log("⚠️ Missing fields");
      return res.send("❌ All fields are required");
    }

    const trimmedUsername = username.trim();
    const trimmedPhone = phone.toString().trim();

    console.log("🔹 Trimmed Username:", trimmedUsername);
    console.log("🔹 Trimmed Phone:", trimmedPhone);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: trimmedUsername }, { phone: trimmedPhone }]
    });

    console.log("🔹 Existing User Found:", existingUser);

    if (existingUser) {
      if (existingUser.username === trimmedUsername) {
        console.log("⚠️ Username already exists");
        return res.send("❌ Username already exists");
      }
      if (existingUser.phone === trimmedPhone) {
        console.log("⚠️ Phone number already registered");
        return res.send("❌ Phone number already registered");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔹 Hashed Password:", hashedPassword);

    // Create new user
    const user = new User({
      username: trimmedUsername,
      phone: trimmedPhone,
      password: hashedPassword
    });

    const savedUser = await user.save();
    console.log("✅ User Saved:", savedUser);

    res.send("✅ Registration successful");
  } catch (err) {
    console.log("❌ Error in /register:", err);
    res.send("❌ Error registering user");
  }
});


// ------------------ Login ------------------
app.post("/login", async (req, res) => {
  try {
    console.log("📌 Login Request Body:", req.body);

    const { username, phone, password } = req.body;

    const trimmedUsername = username.trim();
    const trimmedPhone = phone.toString().trim();

    // 1️⃣ Check if username exists
    const userByUsername = await User.findOne({ username: trimmedUsername });
    if (!userByUsername) {
      console.log("⚠️ Username not found:", trimmedUsername);
      return res.send("❌ Username not found");
    }

    // 2️⃣ Check if phone matches the user
    if (userByUsername.phone !== trimmedPhone) {
      console.log("⚠️ Phone number does not match for user:", trimmedUsername);
      return res.send("❌ Phone number does not match");
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, userByUsername.password);
    console.log("🔹 Password Match:", isMatch);

    if (!isMatch) return res.send("❌ Wrong password");

    // 4️⃣ Success
    req.session.user = userByUsername.username;
    res.send("✅ Login successful");

  } catch (err) {
    console.log("❌ Error in /login:", err);
    res.send("❌ Error logging in");
  }
});

// ------------------ Dashboard ------------------
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ------------------ Logout ------------------
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// ------------------ Start Server ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});