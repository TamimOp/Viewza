import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

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
  //upload them to cloudinary, avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for response creation
  //return response
});

export { registerUser };
