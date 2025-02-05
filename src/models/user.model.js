import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the User schema with Mongoose
const userSchema = new mongoose.Schema(
  {
    // Unique username, stored in lowercase for consistency
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      index: true, // Improves search efficiency
    },
    // Unique email, stored in lowercase for case-insensitive search
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    // Full name of the user, indexed for faster searches
    fullName: {
      type: String,
      required: true,
      index: true,
    },
    // Profile picture URL (usually stored in Cloudinary)
    avatar: {
      type: String,
      required: true,
    },
    // Cover image URL (optional)
    coverImage: {
      type: String,
    },
    // Reference to the watch history, linked to Video collection
    watchHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    // Hashed password stored securely
    password: {
      type: String,
      required: [true, "password is required"],
    },
    // Refresh token for authentication (stored in DB to manage token rotation)
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Middleware to hash password before saving user data
userSchema.pre("save", async function (next) {
  // If password is not modified, move to the next middleware
  if (!this.isModified("password")) return next();

  // Hash the password with bcrypt (11 rounds of salt for security)
  this.password = await bcrypt.hash(this.password, 11);
  next();
});

// Method to compare entered password with stored (hashed) password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate an access token for authentication
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET, // Secret key from environment variables
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // Expiry time from environment variables
    }
  );
};

// Method to generate a refresh token (used for token rotation)
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id, // Contains only user ID for security reasons
    },
    process.env.REFRESH_TOKEN_SECRET, // Secret key for refresh token
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Expiry time from environment variables
    }
  );
};

// Export the User model based on the schema
export const User = mongoose.model("User", userSchema);
