import appError from "../utils/appError.js";
import httpStatusText from './../utils/httpStatusText.js';

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(err);
      next(appError.create(httpStatusText.FAIL,err.message || 'Internal Server Error', 500));
    });
  };
}

export default asyncHandler;