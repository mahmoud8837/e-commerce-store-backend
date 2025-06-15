import express from "express";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import {
  createCategory,
  listCategory,
  readCategory,
  removeCategory,
  updateCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.route("/").post(authenticate, authorizeAdmin, createCategory);

router.route("/categories").get(listCategory);

router
.route("/:categoryId")
.put(authenticate, authorizeAdmin, updateCategory)
.delete(authenticate, authorizeAdmin, removeCategory)
.get(readCategory);


export default router;
