import asyncHandler from "../middlewares/asyncHandler.js";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import appError from "../utils/appError.js";
import httpStatusText from "../utils/httpStatusText.js";

const createOrder = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const { shippingAddress, paymentMethod } = req.body;

  if (
    !user?.cart ||
    !user?.cart?.products ||
    user?.cart?.products.length == 0
  ) {
    return next(appError.create(httpStatusText.FAIL, "No order items", 400));
  } else {
    const order = new Order({
      orderItems: user.cart.products,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice: user.cart.itemsPrice,
      shippingPrice: user.cart.shippingPrice,
      totalPrice: user.cart.totalPrice,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
});

const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({}).populate("user", "username email");
  if (!orders) {
    return next(appError.create(httpStatusText.FAIL, "There is no orders"));
  }

  res.status(200).json({ status: httpStatusText.SUCCESS, orders });
});

const getUserOrder = asyncHandler(async (req, res, next) => {
  const userOrders = await Order.find({ user: req.user._id }).populate(
    "user",
    "username email"
  );
  if (!userOrders) {
    return next(appError.create(httpStatusText.FAIL, "You have no orders"));
  }
  res.status(200).json({ status: httpStatusText.SUCCESS, userOrders });
});

const countTotalOrders = asyncHandler(async (req, res, next) => {
  const totalOrders = await Order.countDocuments();
  res.status(200).json({ status: httpStatusText.SUCCESS, totalOrders });
});

const calculateTotalSales = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({});
  const totalSales = orders.reduce((sum, order) => sum + order?.totalPrice, 0);
  res.status(200).json({ status: httpStatusText.SUCCESS, totalSales });
});

const calculateTotalSalesByDate = asyncHandler(async (req, res, next) => {
  const salesByDate = await Order.aggregate([
    {
      $match: {
        isPaid: true,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
        },
        totalSales: { $sum: "$totalPrice" },
      },
    },
  ]);

  res.status(200).json({ status: httpStatusText.SUCCESS, salesByDate });
});

const findOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "username email"
  );
  if (order) {
    res.status(200).json({ status: httpStatusText.SUCCESS, order });
  } else {
    return next(
      appError.create(httpStatusText.FAIL, "Order is not found", 404)
    );
  }
});

const markOrderAsPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };
    const updateOrder = await order.save();
    res.status(200).json(updateOrder);
  } else {
    return next(
      appError.create(httpStatusText.FAIL, "Order is not found", 404)
    );
  }
});

const markOrderAsDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    return next(
      appError.create(httpStatusText.FAIL, "Order is not found", 404)
    );
  }
});

export {
  createOrder,
  getAllOrders,
  getUserOrder,
  countTotalOrders,
  calculateTotalSales,
  calculateTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
};
