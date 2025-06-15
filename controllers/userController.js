import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import appError from "../utils/appError.js";
import bcrypt from "bcryptjs";
import httpStatusText from "../utils/httpStatusText.js";
import createToken from "../utils/createToken.js";
import Product from "../models/productModel.js";

const createUser = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    const error = appError.create(
      httpStatusText.FAIL,
      "Please fill up the inputs",
      404
    );
    next(error);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = appError.create(
      httpStatusText.FAIL,
      "User already exists",
      400
    );
    next(error);
  } else {
    const hashedPassword = await bcrypt.hash(password, process.env.SALT);

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
    });

    try {
      await newUser.save();

      createToken(res, newUser._id);

      res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
      });
    } catch {
      const error = appError.create(
        httpStatusText.FAIL,
        "Invalid user data",
        400
      );
      next(error);
    }
  }
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "Please write your email and password"
      ),
      402
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    const error = appError.create(
      httpStatusText.FAIL,
      "Please Sign In First Then Try To Log In",
      401
    );
    return next(error);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = appError.create(
      httpStatusText.FAIL,
      "invalid email or password",
      401
    );
    return next(error);
  }

  createToken(res, user._id);
  return res.status(200).json({
    message: "Logged In Successfully",
    _id: user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

const logoutCurrentUser = asyncHandler(async (req, res, next) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged Out Successfully" });
});

const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({}).select("-password");
  return res.status(200).json({ status: httpStatusText.SUCCESS, data: users });
});

const getOneUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return next(appError.create(httpStatusText.FAIL, "User not found", 404));
  }
  res.status(201).json({ status: httpStatusText.SUCCESS, user });
});

const getCurrentUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(appError.create(httpStatusText.FAIL, "User not found"));
  }
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    currentUserProfile: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

const updateCurrentUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(appError.create(httpStatusText.FAIL, "User not found"));
  }

  const username = req.body.username || user.username;
  const password = req.body.password || user.password;
  const email = req.body.email || user.email;

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (username == user.username && isValidPassword && email == user.email) {
    return next(
      appError.create(httpStatusText.FAIL, "Please update any data", 402)
    );
  }

  if (email != user.email) {
    const isEmailUsed = await User.findOne({ email });
    if (isEmailUsed) {
      return next(
        appError.create(httpStatusText.FAIL, "Email is already used", 402)
      );
    }
  }

  const hashedPassword = await bcrypt.hash(password, process.env.SALT);

  await User.findByIdAndUpdate(req.user._id, {
    username,
    password: hashedPassword,
    email,
  });

  const updatedUser = await User.findById(req.user._id);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    updatedUser: {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    },
  });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      appError.create(httpStatusText.FAIL, "User already not found", 500)
    );
  }
  if (user.isAdmin) {
    return next(
      appError.create(httpStatusText.FAIL, "Cannot delete an admin", 400)
    );
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "User deleted successfully",
  });
});

const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(appError.create(httpStatusText.FAIL, "user not found", 400));
  }

  const username = req.body.username || user.username;
  const email = req.body.email || user.email;
  const isAdmin = Boolean(req.body.isAdmin);

  if (
    username == user.username &&
    email == user.email &&
    isAdmin == user.isAdmin
  ) {
    return next(
      appError.create(httpStatusText.FAIL, "Please update any data", 400)
    );
  }

  if (email != user.email) {
    const isUsedEmail = await User.findOne({ email });
    if (isUsedEmail) {
      return next(
        appError.create(httpStatusText.FAIL, "This Email Is Already Used", 400)
      );
    }
  }

  await User.findByIdAndUpdate(req.params.id, { username, email, isAdmin });

  const updatedUser = await User.findById(req.params.id).select("-password");

  return res.status(200).json({ status: httpStatusText.SUCCESS, updatedUser });
});

const addFavourite = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "Log in to add the product to your favourites",
        404
      )
    );
  }

  const productId = req.params.id;

  if (!productId) {
    return next(
      appError.create(httpStatusText.FAIL, "ProductId is required", 400)
    );
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not found", 404)
    );
  }

  if (user.favouriteProducts) {
    const alreadyExists = user.favouriteProducts.find(
      (fav) => fav == productId
    );
    if (alreadyExists) {
      return next(
        appError.create(
          httpStatusText.FAIL,
          "Product already is favourite",
          404
        )
      );
    }
  } else {
    user.favouriteProducts = [];
  }
  // await product.save();

  user.favouriteProducts.push(productId);

  await user.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Product is added to favourites successfully",
  });
});

const removeFavourite = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;

  if (!productId) {
    return next(
      appError.create(httpStatusText.FAIL, "ProductId is required", 400)
    );
  }

  const user = await User.findById(req.user._id);

  const product = await Product.findById(productId);
  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not found", 404)
    );
  }

  if (!user.favouriteProducts || user.favouriteProducts.length == 0) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "Product already is not favourite",
        400
      )
    );
  }

  const alreadyExists = user.favouriteProducts.find((id) => id == productId);
  if (!alreadyExists) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "Product already is not favourite",
        400
      )
    );
  } else {
    // user.favouriteProducts.filter(id => id.toString() != productId.toString());
    user.favouriteProducts.splice(user.favouriteProducts.indexOf(productId), 1);
    await user.save();
    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Product deleted form favourites successfully",
    });
  }
});

const getFavourites = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "Log in to see your favourite products",
        400
      )
    );
  }

  if (!user.favouriteProducts || user.favouriteProducts.length == 0) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "You have not any favouite product",
        400
      )
    );
  } else {
    user.favouriteProducts.map(
      asyncHandler(async (id) => {
        const product = await Product.findById(id);
        if (!product) {
          user.favouriteProducts.splice(user.favouriteProducts.indexOf(id), 1);
          await user.save();
        }
        if (id == user.favouriteProducts.at(-1)) {
          res.status(200).json({
            status: httpStatusText.SUCCESS,
            products: user.favouriteProducts,
          });
        }
      })
    );
  }
});

const addToCart = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;
  const qty = +req.body?.qty || 1;

  const product = await Product.findById(productId);
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(appError.create(httpStatusText.FAIL, "Log in first", 404));
  }

  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not found", 404)
    );
  }

  if (qty) {
    if (qty <= product.quantity && qty > 0) {
      if (!user.cart) {
        user.cart = {
          products: [],
        };
      } else if (
        user.cart.products.length > 0 &&
        user.cart.products?.find(
          (p) => p?._id.toString() === productId.toString()
        )
      ) {
        const user = await User.findById(req.user._id);
        user?.cart?.products.map(async (p) => {
          const foundProduct = await Product.findById(p._id);
          if (foundProduct && foundProduct != p.product) {
            p.product = foundProduct;
            await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
            const itemsPrice = user.cart.products
              .reduce((acc, item) => acc + item.product.price * item.qty, 0)
              .toFixed(2);

            user.cart.itemsPrice = itemsPrice;

            const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

            user.cart.shippingPrice = shippingPrice;

            const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

            user.cart.taxPrice = taxPrice;

            user.cart.totalPrice = (
              +itemsPrice +
              +taxPrice +
              +shippingPrice
            ).toFixed(2);
          }
          if (!foundProduct) {
            user.cart.products = user.cart.products.filter(
              (i) => i._id != p._id
            );
            await user.save();

            const itemsPrice = user.cart.products
              .reduce((acc, item) => acc + item.product.price * item.qty, 0)
              .toFixed(2);

            user.cart.itemsPrice = itemsPrice;

            const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

            user.cart.shippingPrice = shippingPrice;

            const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

            user.cart.taxPrice = taxPrice;

            user.cart.totalPrice = (
              +itemsPrice +
              +taxPrice +
              +shippingPrice
            ).toFixed(2);

            await user.save();
          }
        });

        return next(
          appError.create(
            httpStatusText.FAIL,
            "Product is already in cart",
            404
          )
        );
      }

      user.cart.products.unshift({ _id: productId, qty, product });

      user?.cart?.products.map(async (p) => {
        const foundProduct = await Product.findById(p._id);

        if (foundProduct && foundProduct != p.product) {
          p.product = foundProduct;
        }

        if (!foundProduct) {
          user.cart.products = user.cart.products.filter((i) => i._id != p._id);
          const itemsPrice = user.cart.products
            .reduce((acc, item) => acc + item.product.price * item.qty, 0)
            .toFixed(2);

          user.cart.itemsPrice = itemsPrice;

          const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

          user.cart.shippingPrice = shippingPrice;

          const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

          user.cart.taxPrice = taxPrice;

          user.cart.totalPrice = (
            +itemsPrice +
            +taxPrice +
            +shippingPrice
          ).toFixed(2);
        } else {
          const itemsPrice = user.cart.products
            .reduce((acc, item) => acc + item.product.price * item.qty, 0)
            .toFixed(2);

          user.cart.itemsPrice = itemsPrice;

          const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

          user.cart.shippingPrice = shippingPrice;

          const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

          user.cart.taxPrice = taxPrice;

          user.cart.totalPrice = (
            +itemsPrice +
            +taxPrice +
            +shippingPrice
          ).toFixed(2);
        }
        await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
      });

      res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Product is added to cart successfully",
      });
    } else if (qty == 0) {
      return next(
        appError.create(httpStatusText.FAIL, "Please choose the quantity", 404)
      );
    } else {
      return next(
        appError.create(
          httpStatusText.FAIL,
          "This quantity of this product is not available",
          404
        )
      );
    }
  }
});

const deleteFromCart = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(appError.create(httpStatusText.FAIL, "Log in first", 404));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not found", 404)
    );
  }

  if (!user.cart || !user.cart?.products) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "Product already is not in the cart",
        404
      )
    );
  }

  if (
    user.cart.products.find((p) => p._id.toString() === productId.toString())
  ) {
    user.cart.products = user.cart.products.filter(
      (p) => p._id.toString() != productId.toString()
    );
    user?.cart?.products?.map(async (p) => {
      const foundProduct = await Product.findById(p._id);
      if (foundProduct && foundProduct != p.product) {
        p.product = foundProduct;
        await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
        const itemsPrice = user.cart.products
          .reduce((acc, item) => acc + item.product.price * item.qty, 0)
          .toFixed(2);

        user.cart.itemsPrice = itemsPrice;

        const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

        user.cart.shippingPrice = shippingPrice;

        const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

        user.cart.taxPrice = taxPrice;

        user.cart.totalPrice = (
          +itemsPrice +
          +taxPrice +
          +shippingPrice
        ).toFixed(2);
      }
      if (!foundProduct) {
        user.cart.products = user.cart.products.filter((i) => i._id != p._id);
        const itemsPrice = user.cart.products
          .reduce((acc, item) => acc + item.product.price * item.qty, 0)
          .toFixed(2);

        user.cart.itemsPrice = itemsPrice;

        const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

        user.cart.shippingPrice = shippingPrice;

        const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

        user.cart.taxPrice = taxPrice;

        user.cart.totalPrice = (
          +itemsPrice +
          +taxPrice +
          +shippingPrice
        ).toFixed(2);
      } else {
        user.cart.products = user.cart.products.filter(
          (p) => p._id.toString() != productId.toString()
        );
        const itemsPrice = user.cart.products
          .reduce((acc, item) => acc + item.product.price * item.qty, 0)
          .toFixed(2);

        user.cart.itemsPrice = itemsPrice;

        const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

        user.cart.shippingPrice = shippingPrice;

        const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

        user.cart.taxPrice = taxPrice;

        user.cart.totalPrice = (
          +itemsPrice +
          +taxPrice +
          +shippingPrice
        ).toFixed(2);
      }
      await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
    });

    if (user?.cart?.products?.length == 0) {
      user.cart.itemsPrice = 0;

      user.cart.shippingPrice = 0;

      user.cart.taxPrice = 0;

      user.cart.totalPrice = 0;

      await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
    }

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Product is deleted from cart successfully",
    });
  } else {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "Product already is not in the cart",
        404
      )
    );
  }
});

const updateAmountInCart = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(appError.create(httpStatusText.FAIL, "Log in first", 404));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not found", 404)
    );
  }

  if (!user.cart || !user.cart?.products) {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not in the cart", 404)
    );
  }

  if (
    user.cart.products.find((p) => p._id.toString() === productId.toString())
  ) {
    if (req?.body?.qty || req?.body?.qty == 0) {
      if (req?.body?.qty <= product.quantity && req?.body?.qty > 0) {
        user.cart.products.find(
          (p) => p._id.toString() === productId.toString()
        ).qty = req.body.qty;
      } else if (req.body.qty == 0) {
        user.cart.products = user.cart.products.filter(
          (p) => p._id.toString() != productId.toString()
        );
      } else {
        return next(
          appError.create(
            httpStatusText.FAIL,
            "This quantity of this product is not available",
            404
          )
        );
      }
    }
    user?.cart?.products.map(async (p) => {
      const foundProduct = await Product.findById(p._id);
      if (foundProduct && foundProduct != p.product) {
        p.product = foundProduct;
        await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
        const itemsPrice = user.cart.products
          .reduce((acc, item) => acc + item.product.price * item.qty, 0)
          .toFixed(2);

        user.cart.itemsPrice = itemsPrice;

        const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

        user.cart.shippingPrice = shippingPrice;

        const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

        user.cart.taxPrice = taxPrice;

        user.cart.totalPrice = (
          +itemsPrice +
          +taxPrice +
          +shippingPrice
        ).toFixed(2);
      }
      if (!foundProduct) {
        user.cart.products = user.cart.products.filter((i) => i._id != p._id);
        const itemsPrice = user.cart.products
          .reduce((acc, item) => acc + item.product.price * item.qty, 0)
          .toFixed(2);

        user.cart.itemsPrice = itemsPrice;

        const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

        user.cart.shippingPrice = shippingPrice;

        const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

        user.cart.taxPrice = taxPrice;

        user.cart.totalPrice = (
          +itemsPrice +
          +taxPrice +
          +shippingPrice
        ).toFixed(2);
      } else {
        const itemsPrice = user.cart.products
          .reduce((acc, item) => acc + item.product.price * item.qty, 0)
          .toFixed(2);

        user.cart.itemsPrice = itemsPrice;

        const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

        user.cart.shippingPrice = shippingPrice;

        const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

        user.cart.taxPrice = taxPrice;

        user.cart.totalPrice = (
          +itemsPrice +
          +taxPrice +
          +shippingPrice
        ).toFixed(2);
      }
      await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
    });
    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Product quantity in cart updated successfully",
    });
  } else {
    return next(
      appError.create(httpStatusText.FAIL, "Product is not in the cart", 404)
    );
  }
});

const getCartProducts = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(appError.create(httpStatusText.FAIL, "Log in first", 400));
  }

  if (!user.cart) {
    return next(
      appError.create(
        httpStatusText.FAIL,
        "You have not any product in cart",
        400
      )
    );
  } else {
    if (user?.cart?.products?.length > 0) {
      const cartLength = user?.cart?.products?.length;
      user?.cart?.products.map(async (p, index) => {
        const foundProduct = await Product.findById(p._id);
        if (foundProduct && foundProduct != p.product) {
          p.product = foundProduct;
          await User.findByIdAndUpdate(req.user._id, { cart: user.cart });

          if (p.qty > foundProduct.quantity) {
            p.qty = foundProduct.quantity;
          }

          if (p.qty == 0) {
            user.cart.products = user.cart.products.filter(
              (pro) => pro._id.toString() != p._id.toString()
            );
          }

          await User.findByIdAndUpdate(req.user._id, { cart: user.cart });

          const itemsPrice = user.cart.products
            .reduce((acc, item) => acc + item.product.price * item.qty, 0)
            .toFixed(2);

          user.cart.itemsPrice = itemsPrice;

          const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

          user.cart.shippingPrice = shippingPrice;

          const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

          user.cart.taxPrice = taxPrice;

          user.cart.totalPrice = (
            +itemsPrice +
            +taxPrice +
            +shippingPrice
          ).toFixed(2);
        }
        if (!foundProduct) {
          user.cart.products = user.cart.products.filter((i) => i._id != p._id);
          const itemsPrice = user.cart.products
            .reduce((acc, item) => acc + item.product.price * item.qty, 0)
            .toFixed(2);

          user.cart.itemsPrice = itemsPrice;

          const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

          user.cart.shippingPrice = shippingPrice;

          const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

          user.cart.taxPrice = taxPrice;

          user.cart.totalPrice = (
            +itemsPrice +
            +taxPrice +
            +shippingPrice
          ).toFixed(2);
        } else {
          const itemsPrice = user.cart.products
            .reduce((acc, item) => acc + item.product.price * item.qty, 0)
            .toFixed(2);

          user.cart.itemsPrice = itemsPrice;

          const shippingPrice = +user.cart.itemsPrice > 100 ? 0 : 10;

          user.cart.shippingPrice = shippingPrice;

          const taxPrice = (0.15 * +user.cart.itemsPrice).toFixed(2);

          user.cart.taxPrice = taxPrice;

          user.cart.totalPrice = (
            +itemsPrice +
            +taxPrice +
            +shippingPrice
          ).toFixed(2);
        }
        await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
        if (index == cartLength - 1) {
          res.status(200).json({
            status: httpStatusText.SUCCESS,
            cart: user.cart,
          });
        }
      });
    } else {
      res.status(200).json({
        status: httpStatusText.SUCCESS,
        cart: user.cart,
      });
    }
  }
});

const clearCartItems = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user?.cart) {
    user.cart.products = [];
  
    user.cart.itemsPrice = 0;
  
    user.cart.shippingPrice = 0;
  
    user.cart.taxPrice = 0;
  
    user.cart.totalPrice = 0;
    await User.findByIdAndUpdate(req.user._id, { cart: user.cart });
  }

  res.status(200).json({status: httpStatusText.SUCCESS, message: "Cart is cleared successfully"})


});

export {
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
  clearCartItems,
};
