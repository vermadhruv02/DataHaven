import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
