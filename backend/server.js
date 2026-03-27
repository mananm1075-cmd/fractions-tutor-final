const express = require("express");
const cors = require("cors");

const tutorRoutes = require("./routes/tutorRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "fractions-tutor-backend" });
});

app.use("/api", tutorRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});