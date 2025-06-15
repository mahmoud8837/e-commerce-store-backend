import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";
import appError from "../utils/appError.js";
import httpStatusText from "../utils/httpStatusText.js";

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Read jwt Cookie
  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // select here exclude password from data saved in req.user
      req.user = await User.findById(decoded.userId).select("-password");
      next();
    } catch {
      next(
        appError.create(httpStatusText.FAIL, "Not authorized, token failed", 401)
      );
    }
  } else {
    return next(appError.create(httpStatusText.FAIL, "Not authorized, no token, please log in", 401));
  }
});

const authorizeAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    next(appError.create(httpStatusText.FAIL, "Available Only For Admins", 401));
  }
});

export { authenticate, authorizeAdmin };