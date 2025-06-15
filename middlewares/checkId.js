import { isValidObjectId } from "mongoose";
import appError from "../utils/appError.js";
import httpStatusText from "../utils/httpStatusText.js";

const checkId = (req, res, next) =>  {
  if (!isValidObjectId(req.params.id)) {
    return next(appError.create(httpStatusText.FAIL, `Invalid Object of: ${req.params.id}`));
  }
  next();
}

export default checkId;