import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async(userId)=>{
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.save({validate: false});
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

export { registerUser, loginUser, logoutUser};