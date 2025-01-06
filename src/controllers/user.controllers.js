import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {

  console.log("register user called!!!");
  
  const { username, email, fullName, password } = req.body;
  if (
    [username, email, fullName, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required.");
  }
  
  const userExisted = User.findOne({ $or: [{ username }, { email }] });
  if (userExisted) {
    throw new ApiError(409, "email or password already registered.");
  }

  const avtarLocalFilePath = req.files?.avtar[0]?.path;
  const coverImageFilePath = req.files?.coverImage[0]?.path;
  if (avtarLocalFilePath) {
    throw new ApiError(405, "Avtar is required");
  }
 
  const avtar = await uploadOnCloudinary(avtarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageFilePath);
  if (avtar) {
    throw new ApiError(405, "Avtar is required");
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    avtar: avtar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const newUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!newUser) {
    throw new ApiError(500, "somthing went wrong while registering user");
  }

  return res.status(201).json(ApiResponse(200, newUser, "new User registered"));
});

export { registerUser };
