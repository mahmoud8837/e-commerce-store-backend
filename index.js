// Packages
import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
// import cors from "cors";

// Utils
import connectDB from "./config/db.js";

dotenv.config();
const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use(
//   cors({
//     origin: ["http://localhost:5173"],
//     credentials: true,
//   })
// );

import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/api/config/paypal", (req, res) => {
  res.json({clientId: process.env.PAYPAL_CLIENT_ID});
})

const __dirname = path.resolve();

app.use("/uploads", express.static(path.join(__dirname, '/uploads')));

app.use((error, req, res, next) => {
  return res.status(error.statusCode || 500).json({
    httpStatusText: error.httpStatusText,
    status: error.statusCode || 500,
    message: error.message,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
