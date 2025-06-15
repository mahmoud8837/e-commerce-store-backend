import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    favouriteProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        unique: true,
      },
    ],
    reviewedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        unique: true,
      },
    ],
    cart: new mongoose.Schema({
      products: [
        {
          product: {
            type: Object,
            required: true,
            default: {}
          },
          qty: {
            type: Number,
            required: true,
            default: 1,
          }
        },
      ],
      itemsPrice: {
        type: Number,
        default: 0,
        required: true,
      },
      shippingPrice: {
        type: Number,
        default: 0,
        required: true,
      },
      taxPrice: {
        type: Number,
        default: 0,
        required: true,
      },
      totalPrice: {
        type: Number,
        required: true,
        default: 0,
      },
    }),
  },
  { timeseries: true }
);

const User = mongoose.model("User", userSchema);

export default User;
