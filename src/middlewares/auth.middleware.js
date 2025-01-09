import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.models.js'


export const verifyJWT = asyncHandler(async (req,_ ,next)=>{
    try {
        // console.log(req.cookies);
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        // console.log( token );
    
        if(!token) throw new ApiError(401, "Unauthorized request");
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log(decodedToken);
        
        const user = await User.findById(decodedToken?.id).select("-password -refreshToken");
        // console.log(user);
        
        if(!user) throw new ApiError(401, "Invalid Access Token");
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }


});