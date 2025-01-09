import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async(userId)=>{
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({validate: false});
  return {accessToken, refreshToken};
}

const registerUser = asyncHandler(async (req, res) => {
  // console.log("register user called!!!");
  
  const { username, email, fullName, password } = req.body;
  if ([username, email, fullName, password].some((field) => field.trim() === "")){
    throw new ApiError(400, "all fields are required.");
  }
  
  const userExisted = await User.findOne({ $or: [{ username }, { email }] });
  if (userExisted) {
    throw new ApiError(409, "email or password already registered.");
  }

  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  // const coverImageFilePath = req.files?.coverImage[0]?.path;
  
  if (!avatarLocalFilePath) {
    throw new ApiError(405, "Avatar is required local file path");
  }

  let coverImageFilePath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageFilePath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageFilePath);
  
  if (!avatar) {
    throw new ApiError(405, "Avatar is required cloudinary");
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const newUser = await User.findById(user._id).select("-password -refreshToken");

  if (!newUser) {
    throw new ApiError(500, "somthing went wrong while registering user");
  }

  return res.status(201).json( new ApiResponse(200, newUser, "new User registered"));
});

const loginUser = asyncHandler(async (req, res)=> {
  
  const { username, email, password} = req.body;

  if(!username && !email) throw new ApiError(400, "Username or Email is required");
  
  const user = await User.findOne({
    $or: [{ username }, { email }]
  });
  if(!user) throw new ApiError(404,"user does not exists");

  const validation = await user.isPasswordCorrect(password);
  if(!validation) throw new ApiError(409, "Invalid login credentials");

  // console.log("user validated");
  

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
  // console.log(`token generated ${accessToken}`);
  
  const updateUser = await User.findById(user._id).select("-password -refreshToken");
  // console.log(updateUser);

  const options= {
    httpOnly: true,
    secure: true,
  }

  res
  .status(200)
  .cookie("accessToken", accessToken,options)
  .cookie("refreshToken", refreshToken,options)
  .json(new ApiResponse(200, {user: updateUser, accessToken,refreshToken}, "User is logged In"));
});

const logoutUser = asyncHandler(async (req,res)=>{
  console.log(`logout route reached`);

  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true
  }

  res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"user logged out"))
  
});

const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if(!incomingRefreshToken) throw new ApiError(400,'unauthorized request');
  
  const options = {
    httpOnly: true,
    secure: true
  }

  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET, options);

  const user = await User.findById(decodedToken.id);
  if(!user) throw new ApiError(400, 'Invalid Refresh Token');

  // console.log(user);
  // console.log(`incomingRefreshToken :- ${incomingRefreshToken} `);
  // console.log(`user RefreshToken :- ${user.refreshToken} `);

  if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(400, 'refresh token expired please login again');

  const {accessToken, refreshToken }= await generateAccessTokenAndRefreshToken(user.id);
  
  res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(new ApiResponse(200,{accessToken,refreshToken}, "Access Token refreshed"))

});

const changePassword = asyncHandler(async (req,res)=>{
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById( req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if(!isPasswordCorrect ) throw new ApiError(400,'password is incorrect');

  user.password = newPassword;
  await user.save({validate: false});
  
  res
  .status(200)
  .json(new ApiResponse(200,{},"password updated sucessfully"))
});

const getUser = asyncHandler(async (req,res)=>{
  res
  .status(200)
  .json(new ApiResponse(200,req.user,"user object is sent"))
})

const updateUserDetails = asyncHandler(async (req,res)=>{
  const { fullName, email} = req.body;
  if(!fullName || !email) throw new ApiError(400,"Both detailes are required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      }
    },
    {
      new: true,
    }
  ).select("-password")

  res
  .status(200)
  .json(new ApiResponse(200,user, "user updated" ));

})

const updateAvatar = asyncHandler(async (req,res)=>{
  
  const avatarLocalFilePath = req.file?.path;
  if(!avatarLocalFilePath) throw new ApiError(400, "file was not uploaded to server");

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  if(!avatar) throw new ApiError(400, "file was not uploaded to cloudinary");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar?.url }
    },
    {
      new: true,
    }
  ).select("-password")
  
  res
  .status(200)
  .json(new ApiResponse(200, user, "Avtar Updated"))
})

const updateCoverImage = asyncHandler(async (req,res)=>{
  
  const coverImageFilePath = req.file?.path;
  if(!coverImageFilePath) throw new ApiError(400, "file was not uploaded to server");

  const coverImage = await uploadOnCloudinary(coverImageFilePath);
  if(!coverImage) throw new ApiError(400, "file was not uploaded to cloudinary");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverImage: coverImage?.url }
    },
    {
      new: true,
    }
  ).select("-password")
  
  res
  .status(200)
  .json(new ApiResponse(200, user, "coverImage Updated"))
})

export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  changePassword, 
  getUser, 
  updateUserDetails,
  updateAvatar,
  updateCoverImage
};