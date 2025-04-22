// Import required modules
const express = require("express");
const fs = require("fs/promises"); // Async file handling
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = 3000;
const SECRET_KEY = "secret"; // JWT signing key

app.use(express.json()); // Middleware to parse JSON

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Read & Write database (database.json)
const loadUsers = async () => {
    try {
        const data = await fs.readFile("database.json", "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading database.json", err);
        return [];
    }
};

const saveUsers = async (users) => {
    try {
        await fs.writeFile("database.json", JSON.stringify(users, null, 2));
    } catch (err) {
        console.error("Error writing to database.json", err);
    }
};

// Register Route
app.post("/signup", async (req, res) => {
    const { name, password, work } = req.body;
    const users = await loadUsers();

    if (users.some(user => user.name === name)) {
        return res.status(400).json({ error: "User already registered" });
    }

    users.push({ name, password, work });
    await saveUsers(users);

    res.json({ message: "Successfully Registered" });
});

// Login Route
app.post("/login", async (req, res) => {
    const { name, password } = req.body;
    const users = await loadUsers();

    const user = users.find(u => u.name === name && u.password === password);
    if (!user) {
        return res.status(401).json({ error: "Invalid name or password" });
    }

    const token = jwt.sign({ name: user.name, work: user.work }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// JWT Middleware
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "Access denied, token missing" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = decoded;
        next();
    });
};

// Protected Profile Route
app.get("/profile", verifyToken, (req, res) => {
    res.json({ message: "Welcome to your profile", user: req.user });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
