// Load dotenv module
// require('dotenv').config(); // Ensure environment variables are loaded from the .env file

// Load express module
const express = require('express');

// Load Mongoose module
const mongoose = require('mongoose');

// Load Multer and path for file upload
const multer = require('multer');
const path = require('path');

// Load CORS for cross-origin requests
const cors = require('cors');

// Import the seed function for creating admin
const seedAdmin = require('./seedAdmin');

// Initialize Express app
const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.path}`);
  next();
});

// Multer setup for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploaded images to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid filename conflicts
  },
});
const upload = multer({ storage });

// Import route modules
const userRoutes = require('./routes/user');
const carRoutes = require('./routes/car');
const reservationRoutes = require('./routes/reservation');
const authRoutes = require('./routes/authRoutes');

// Use API routes
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/auth', authRoutes);

// Endpoint to fetch PayPal client ID
app.get('/api/config/paypal', (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
);

// API route for uploading images
app.post('/api/upload-image', upload.single('file'), (req, res) => {
  if (req.file) {
    res.json({ url: `/uploads/${req.file.filename}` }); // Return the uploaded image URL
  } else {
    res.status(400).send('No file uploaded.');
  }
});

// Define server port
const PORT = process.env.PORT || 4000;

// Connect to MongoDB and start the server
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');

    // Seed the admin account
    await seedAdmin();

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Serve uploaded images
app.use('/uploads', express.static('uploads')); // Serve static files from 'uploads' directory


// Middleware to serve the React app
// app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use(express.static("../frontend/buil"));

// Route for serving React on all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});