import asyncHandler from "../middlewares/asyncHandler.js";
import Category from "../models/categoryModel.js";
import appError from "../utils/appError.js";
import httpStatusText from "../utils/httpStatusText.js";

const createCategory = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return next(appError.create(httpStatusText.FAIL, "Name is required", 400));
  }
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return next(
      appError.create(httpStatusText.FAIL, "This category already exists", 400)
    );
  }
  const category = new Category({ name });
  await category.save();
  res.status(200).json({ httpStatusText: httpStatusText.SUCCESS, name });
});

const updateCategory = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const { categoryId } = req.params;

  const category = await Category.findOne({ _id: categoryId });
  const categoryByName = await Category.findOne({ name });

  if (!category) {
    return next(
      appError.create(httpStatusText.FAIL, "category not found", 400)
    );
  }
  if (!name) {
    return next(
      appError.create(httpStatusText.FAIL, "Please enter the new name", 400)
    );
  }
  if (name.trim() === category.name && category._id == categoryId) {
    return next(
      appError.create(httpStatusText.FAIL, "You entered the same name", 400)
    );
  } else if (
    categoryByName &&
    name.trim() === categoryByName.name &&
    category._id !== categoryId
  ) {
    return next(
      appError.create(httpStatusText.FAIL, "This category already exists", 400)
    );
  } else {
    await Category.findByIdAndUpdate(categoryId, { name });
    return res.status(200).json({
      httpStatusText: httpStatusText.SUCCESS,
      oldCategoryName: category.name,
      newCategoryName: name,
    });
  }
});

const removeCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(
      appError.create(httpStatusText.FAIL, "Category already not found", 404)
    );
  } else {
    await Category.deleteOne({ _id: categoryId });
    return res.status(200).json({
      httpStatusText: httpStatusText.SUCCESS,
      message: "Category successfully deleted",
    });
  }
});

const listCategory = asyncHandler(async (req, res, next) => {
  // const page = +req.query.page || 1;
  // const limit = +req.query.limit || 10;

  // const startIndex = (page - 1) * limit;
  // const categories = await Category.find({}).skip(startIndex).limit(limit);

  const categories = await Category.find({});
  return res.status(200).json(categories);
});

const readCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    return next(
      appError.create(httpStatusText.FAIL, "Category is not found", 404)
    );
  } else {
    return res.status(200).json(category);
  }
});

export {
  createCategory,
  updateCategory,
  removeCategory,
  listCategory,
  readCategory,
};
