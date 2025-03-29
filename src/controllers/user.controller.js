import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { email, username, password, fullName } = req.body;
  //validation - not empty
  if (
    [email, username, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill in all fields");
  }
  //check if user already exists : email, username
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists with that email or username");
  }
  //check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload an avatar image");
  }
  //upload them to cloudinary, avatar
  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  //create user object - create entry in db
  const user = await User.create({
    email,
    username: username.toLowerCase(),
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  //remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check for response creation
  if (!createdUser) {
    throw new ApiError(500, "User could not be created");
  }
  //return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { email, password } = req.body;
  //validation - not empty
  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please fill in all fields");
  }
  //check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  //check if password is correct
  if (!(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid password");
  }
  //generate token
  const token = await user.generateToken();
  //return response
  return res
    .status(200)
    .json(new ApiResponse(200, { token }, "Login successful"));
});

export { registerUser, loginUser };
