import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

if (!process.env.MONGODB_URL) {
  console.log("Please provide MONGODB_URI in the environment variables");
  process.exit(1);
}

connectDB()
  .then(() => {

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });