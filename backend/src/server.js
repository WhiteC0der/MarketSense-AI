import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import startNewsJob from "./jobs/newsJob.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    
    startNewsJob();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });