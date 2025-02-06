import { asyncHandler } from "../utils/asyncHandler.js"; // Middleware to handle async errors gracefully
import { ApiError } from "../utils/ApiError.js"; // Custom error handling class
import jwt from "jsonwebtoken"; // Library for handling JSON Web Tokens
import { User } from "../models/user.model.js"; // User model to interact with the database

// Middleware to verify JSON Web Token (JWT) for protected routes
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Retrieve the token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // If token is not found, throw an unauthorized error
    if (!token) {
      throw new ApiError(404, "Unauthorized request");
    }

    // Verify the token using the secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch the user details from the database excluding sensitive information
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // If user does not exist, throw an invalid token error
    if (!user) {
      // TODO: Handle frontend response for invalid tokens
      throw new ApiError(401, "Invalid Access Token");
    }

    // Attach user details to the request object for further use
    req.user = user;

    // Pass control to the next middleware or route handler
    next();
  } catch (error) {
    // Handle errors and pass custom error messages
    throw new ApiError(error?.message || "Invalid access token");
  }
});
