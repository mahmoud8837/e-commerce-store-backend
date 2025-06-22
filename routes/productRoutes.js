import express from "express";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import {
  addProduct,
  addProductReview,
  deleteProduct,
  deleteProductReview,
  fetchAllProducts,
  fetchNewProducts,
  fetchProductById,
  fetchProducts,
  fetchTopProducts,
  filterProducts,
  getReviewedProducts,
  updateProduct,
} from "../controllers/productController.js";
import checkId from "./../middlewares/checkId.js";
import path from "node:path";
import multer from "multer";
import appError from "../utils/appError.js";
import httpStatusText from "../utils/httpStatusText.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/products");
  },
  filename: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${Date.now()}${extname}`;
    cb(null, fileName);
    req.fileName = fileName;
  },
});

const fileFilter = (req, file, cb) => {
  const filetype = file.mimetype.split("/")[0];
  if (filetype == "image") {
    cb(null, true);
  } else {
    cb(appError.create(httpStatusText.FAIL, "Images only", 400), false);
  }
};

const upload = multer({ storage, fileFilter });

const uploadSingleImage = upload.single("image");
const imageHandler = (req, res, next) => {
  uploadSingleImage(req, res, (err) => {
    if (err) {
      next(appError.create(httpStatusText.FAIL, err.message, 400));
    } else if (req.file) {
      req.imagePath = `/${req.file.path}`;
      next();
    } else {
      next(appError.create(httpStatusText.FAIL, "Image is required", 400));
    }
  });
};

router
  .route("/")
  .post(authenticate, authorizeAdmin, imageHandler, addProduct)
  .get(fetchProducts);

router.route("/allproducts").get(fetchAllProducts);

router.get("/top", fetchTopProducts);
router.get("/new", fetchNewProducts);

router
  .route("/:id/reviews")
  .post(authenticate, checkId, addProductReview)
  .delete(authenticate, checkId, deleteProductReview);

router.get("/reviews", authenticate, getReviewedProducts)

router
  .route("/:id")
  .get(fetchProductById)
  .put(authenticate, authorizeAdmin, imageHandler, updateProduct)
  .delete(authenticate, authorizeAdmin, deleteProduct);

router.route("/filtered-products").post(filterProducts)

export default router;
