import express from "express";
import {
  createUser,
  loginUser,
  logoutCurrentUser,
  getAllUsers,
  getOneUser,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  deleteUser,
  updateUser,
  addFavourite,
  removeFavourite,
  getFavourites,
  addToCart,
  deleteFromCart,
  updateAmountInCart,
  getCartProducts,
  clearCartItems
} from "../controllers/userController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import checkId from './../middlewares/checkId.js';

const router = express.Router();

router
  .route("/")
  .post(createUser)
  .get(authenticate, authorizeAdmin, getAllUsers);

router.post("/auth", loginUser);

router.post("/logout", logoutCurrentUser);

router
  .route("/profile")
  .get(authenticate, getCurrentUserProfile)
  .put(authenticate, updateCurrentUserProfile);

router.post("/favourites/add/:id", authenticate, addFavourite);
router.delete("/favourites/remove/:id", authenticate, removeFavourite);
router.get("/favourites", authenticate, getFavourites);

router.get("/cart", authenticate, getCartProducts);
router.post("/cart/add/:id", authenticate, checkId, addToCart);
router.delete("/cart/delete/:id", authenticate, checkId, deleteFromCart)
router.put("/cart/update/:id", authenticate, checkId, updateAmountInCart);
router.put("/cart/clear", authenticate, clearCartItems);

router
  .route("/:id")
  .get(authenticate, authorizeAdmin, getOneUser)
  .delete(authenticate, authorizeAdmin, deleteUser)
  .put(authenticate, authorizeAdmin, updateUser);

export default router;
