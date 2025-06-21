// import jwt from "jsonwebtoken";

// const createToken = (res, userId) => {
//   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
//     expiresIn: "30d",
//   });

//   // Set Jwt Token As An HTTP-Only Cookie
//   res.cookie("jwt", token, {
//     httpOnly: true,
//     maxAge: 30 * 24 * 60 * 60 * 1000,
//     sameSite: "strict",
//     secure: process.env.NODE_ENV !== "development" ? true : false,
//   });

//   return token;
// };

// export default createToken;

import jwt from "jsonwebtoken";

const createToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // Set JWT as an HTTP-Only Cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV !== "development",
    secure: true,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default createToken;
