import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res) => {
         
          //get user details from frontend
          //validation - not empty
          //check if user already exist: username,email
          //check for images,check for avatar
          //upload them to cloudinary, again check avatar
          //create user object - create entry in db
          //remove password and refresh token field from response
          //check for user creation
          //return res

          // 1.
         const {email,fullName,username,password} = req.body
          console.log("email :", email);

          // 2.
          // if (fullName === "") {
          //           throw new ApiError(404,"fullName is required")
                    
          // }

          if (
                    [fullName, email, username, password].some((field) =>
                              field?.trim()===""
                    )      
          ) {
               throw new ApiError(400,"All fields are required")     
          }

          // 3.
          const existedUser = User.findOne({
                    $or: [{ username }, { email }]
          } )

          if (existedUser) {
                    throw new ApiError(409,"User is already exist")
          }

          //4.

          const avatarLocalPath = req.files?.avatar[0]?.path;
          const coverImageLocalPath = req.files?.coverImage[0]?.path;

          if (!avatarLocalPath) {
                    throw new ApiError(400,"Avatar file is required")
          }

          // 5.

          const avatar = await uploadOnCloudinary(avatarLocalPath)
          const coverImage = await uploadOnCloudinary(coverImageLocalPath)

          if (!avatar) {
                 throw new ApiError(404,"Avatar file is required")
          }
          
          //6.
         const user =  await User.create({
                    fullName,
                    avatar: avatar.url,
                    coverImage: coverImage?.url || "",
                    email,
                    password,
                    username: username.tolowerCase()
                    
         })
          
          //7.
          const checkUser = await User.findById(user._id).select(
                  "-password -refreshToken"
        )

          if (!checkUser) {
                throw new ApiError(500,"something went wrong throw registering the user")
          }
          
          return res.status(201).json(
                    new ApiResponse(200,checkUser,"User registered successfully")
          )

})


export {registerUser,}