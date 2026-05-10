require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db.config');
const port = process.env.PORT || 8080;

const userRoutes=require ('./routes/user.route');


app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], // your frontend  
  credentials: true
}));

app.use(express.json());
app.use('/api/users',userRoutes);

connectDB();


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 