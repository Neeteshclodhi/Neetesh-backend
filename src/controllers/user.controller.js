import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


//chatgpt se comment likhva lena
const generateAccessAndRefreshTokens = async(userId) => {
    try {
         const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        // console.log("Access token generated:", accessToken);
        const refreshToken = user.generateRefreshToken()
        // console.log("Access token generated:", refreshToken);

        user.refreshToken = refreshToken; //save refresh token in db
        await user.save({ validateBeforeSave:false })

        return {accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {//res = _ ,production grade code me res empty hai to _ laga do
         
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
      //     console.log("email :", email);

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
          const existedUser = await User.findOne({
                    $or: [{ username }, { email }]
          } )

          if (existedUser) {
                    throw new ApiError(409,"User is already exist")
          }
      // console.log(req.files);

          //4.

          const avatarLocalPath = req.files?.avatar[0]?.path;
      //     const coverImageLocalPath = req.files?.coverImage[0]?.path;

      let coverImageLocalPath;
      if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
      }

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
                    username: username
                    
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

const loginUser = asyncHandler(async (req, res) => {
    //req.body -> data
    //username or email
    //find the user
    //password check
    //Access and Refresh token
    //send cookie

    const {username, email, password} = req.body;

    if (!username && !email) {
        throw new ApiError(404,"username or email is required")
    }

    
    //Here is an alternative of above code based on logic discussed in video;
    // if (!(username || email)) {
    //   throw new ApiError(404, "username or email is required");
    // }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if (!user) {
        throw new ApiError(404,"User does not exist")
    }
   const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
       throw new ApiError(401,"Password is Required")
    }
    
    const {accessToken,refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = { //cookie not modifieble
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("AccessToken", accessToken,options)
        .cookie("refreshToken", refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken,
                    refreshToken
                },
                "User Logged in successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(402,"Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure:true
        }
    
        const { accessToken,newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
};