import {asyncHandler} from '../utils/asyncHandler.js'

const registerUser = asyncHandler( async (req,res) => {
    console.log("register user called!!!");
    
    res.status(200).json({
        message:"Dhruv Verma",
    })
});

export {registerUser}