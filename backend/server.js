const express = require("express");
const cors = require("cors");
const path = require("path");

const tutorRoutes = require("./routes/tutorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api", tutorRoutes);

// ---------------- SERVE FRONTEND ----------------

// Serve React build
app.use(express.static(path.join(__dirname, "dist")));

// Catch all → React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ---------------- PORT ----------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});