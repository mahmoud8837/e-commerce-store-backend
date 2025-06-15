import asyncHandler from "../middlewares/asyncHandler.js";
import appError from "../utils/appError.js";
import httpStatusText from "../utils/httpStatusText.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

const addProduct = asyncHandler(async (req, res, next) => {
  const { name, description, brand, category, price, quantity, countInStock } =
    req.body;

  // Validation
  switch (true) {
    case !name:
      return next(
        appError.create(httpStatusText.FAIL, "Name is required", 400)
      );
    case !price:
      return next(
        appError.create(httpStatusText.FAIL, "Price is required", 400)
      );
    case !quantity:
      return next(
        appError.create(httpStatusText.FAIL, "Quantity is required", 400)
      );
    case !brand:
      return next(
        appError.create(httpStatusText.FAIL, "Brand is required", 400)
      );
    case !description:
      return next(
        appError.create(httpStatusText.FAIL, "Description is required", 400)
      );
    case !countInStock:
      return next(
        appError.create(httpStatusText.FAIL, "Count In Stock is required", 400)
      );
    case !category:
      return next(
        appError.create(httpStatusText.FAIL, "Category is required", 400)
      );
  }

  const product = new Product({
    name,
    description,
    brand,
    category,
    price,
    quantity,
    countInStock,
    image: { url: `/${req.file.path}`, name: req.fileName },
    imageName: req.fileName,
  });
  await product.save();
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: product });
});

const fetchProducts = asyncHandler(async (req, res, next) => {
  const page = req.query.page || 1;
  const pageSize = req.query.limit || 6;
  const count = await Product.countDocuments({});
  const pagesCount = Math.ceil(count / pageSize);

  const products = await Product.find({})
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    page,
    pageSize,
    pagesCount,
    productsCount: count,
    products,
  });
});

const fetchAllProducts = asyncHandler(async (req, res, next) => {
  const page = req.query.page || 1;
  const pageSize = req.query.limit || 6;
  const count = await Product.countDocuments({});
  const pagesCount = Math.ceil(count / pageSize);
  const products = await Product.find({})
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate("category")
    .limit(pageSize)
    .sort({ createdAt: -1 });
  res
    .status(200)
    .json({ pagesCount, page, pageSize, products, productsCount: count });
});

const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "This product is not found", 500)
    );
  }

  const { name, description, brand, category, price, quantity, countInStock } =
    req.body;

  switch (true) {
    case !name:
      return next(
        appError.create(httpStatusText.FAIL, "Name is required", 400)
      );
    case !price:
      return next(
        appError.create(httpStatusText.FAIL, "Price is required", 400)
      );
    case !quantity:
      return next(
        appError.create(httpStatusText.FAIL, "Quantity is required", 400)
      );
    case !brand:
      return next(
        appError.create(httpStatusText.FAIL, "Brand is required", 400)
      );
    case !description:
      return next(
        appError.create(httpStatusText.FAIL, "Description is required", 400)
      );
    case !countInStock:
      return next(
        appError.create(httpStatusText.FAIL, "Count In Stock is required", 400)
      );
    case !category:
      return next(
        appError.create(httpStatusText.FAIL, "Category is required", 400)
      );
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      brand,
      category,
      price,
      quantity,
      countInStock,
      image: { url: `/${req.file.path}` || product.image, name: req.fileName },
    },
    { new: true }
  );

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, updatedProduct });
});

const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product already not found", 404)
    );
  } else {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Product successfully deleted",
      deletedProduct: product,
    });
  }
});

const fetchProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not found", 404)
    );
  }
  res.status(200).json({ status: httpStatusText.SUCCESS, product });
});

const addProductReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  const user = await User.findById(req.user._id);
  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not found", 404)
    );
  }
  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return next(
      appError.create(httpStatusText.FAIL, "Product Already reviewed", 400)
    );
  }
  switch (true) {
    case !rating:
      return next(
        appError.create(httpStatusText.FAIL, "Rating is required", 404)
      );
    case !comment:
      return next(
        appError.create(httpStatusText.FAIL, "Comment is required", 404)
      );
  }
  if (!user.reviewedProducts) {
    user.reviewedProducts = [];
    user.reviewedProducts.push(product._id);
  } else {
    user.reviewedProducts.push(product._id);
  }
  await user.save();
  const review = {
    name: req.user.username,
    user: req.user._id,
    rating: Number(rating),
    comment,
  };
  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, message: "Review added" });
});

const deleteProductReview = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;

  const user = await User.findById(req.user._id);

  const product = await Product.findById(productId);

  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not found", 404)
    );
  }

  if (
    !user.reviewedProducts ||
    !user.reviewedProducts?.find(
      (pId) => pId?.toString() === product._id.toString()
    )
  ) {
    return next(
      appError.create(httpStatusText.FAIL, "Product already not reviewed", 404)
    );
  }

  product.reviews = product.reviews.filter((r) => r.user.toString() != req.user._id.toString());
  product.numReviews -= 1;
  if (product.numReviews > 0) {
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.numReviews;
  } else {
    product.rating = 0;
  }

  await product.save();

  user.reviewedProducts.splice(user.reviewedProducts.indexOf(productId), 1);

  await user.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Reveiw deleted successfully",
  });
});

const getReviewedProducts = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "Log in to see your reviewed products",
        400
      )
    );
  }

  if (!user.reviewedProducts || user.reviewedProducts.length == 0) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "You have not review any product",
        400
      )
    );
  } else {
    user.reviewedProducts.map(
      asyncHandler(async (id) => {
        const product = await Product.findById(id);
        if (!product) {
          user.reviewedProducts.splice(user.reviewedProducts.indexOf(id), 1);
          await user.save();
        }
        if (id == user.reviewedProducts.at(-1)) {
          res.status(200).json({
            status: httpStatusText.SUCCESS,
            products: user.reviewedProducts
          });
        }
      })
    );
  }
});

const fetchTopProducts = asyncHandler(async (req, res, next) => {
  const page = req.query.page || 1;
  const pageSize = req.query.limit || 6;
  const count = await Product.countDocuments({});
  const pagesCount = Math.ceil(count / pageSize);
  const products = await Product.find({})
    .sort({ rating: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  res
    .status(200)
    .json({ pagesCount, page, pageSize, products, productsCount: count });
});

const fetchNewProducts = asyncHandler(async (req, res, next) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.limit) || 6;
  const count = await Product.countDocuments({});
  const pagesCount = Math.ceil(count / pageSize);
  const products = await Product.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  res.json({ pagesCount, page, pageSize, products, productsCount: count });
});

const filterProducts = asyncHandler(async(req, res, next) => {
  const {checked, fromPrice, toPrice} = req.body;

  let args = {};
  if (checked.length > 0) args.category = checked;

  if (fromPrice && !toPrice) args.price = {$gte: fromPrice};
  if (toPrice && !fromPrice) args.price = {$lte: toPrice};
  if (fromPrice && toPrice) {
    args.price = {$gte: fromPrice, $lte: toPrice}
  }

  const products = await Product.find(args);

  res.json({status: httpStatusText.SUCCESS, products});

})


export {
  addProduct,
  updateProduct,
  deleteProduct,
  fetchProducts,
  fetchProductById,
  fetchAllProducts,
  addProductReview,
  fetchTopProducts,
  fetchNewProducts,
  deleteProductReview,
  getReviewedProducts,
  filterProducts
};
