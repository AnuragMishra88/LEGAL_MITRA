const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();

// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
   origin: process.env.NODE_ENV === 'production' 
  ? "https://legalmitra-frontend.onrender.com" 
  : "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

// ✅ IMPORT ALL ROUTES
const authRoutes = require("./routes/auth");
const caseRoutes = require("./routes/cases");
const paymentRoutes = require("./routes/payment");
const verificationRoutes = require("./routes/verification");
const adminRoutes = require('./routes/admin');
const lawyerRoutes = require('./routes/lawyer');
const requestRoutes = require('./routes/requests'); // ✅ ADD THIS LINE
const path = require("path");


const _dirname=path.resolve();

// ✅ REGISTER ALL ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/verification", verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lawyer', lawyerRoutes);
app.use('/api/requests', requestRoutes); // ✅ ADD THIS LINE




// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.log("❌ MongoDB connection error:", err));

// ✅ TEST ROUTE (keep this)
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));