import { Router } from "express";
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changePassword, 
    getUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage,
    getChannel,
    getWatchHistory } from "../controllers/user.controllers.js";


const router = Router();

// router.route("/register").post(registerUser);
router.post("/register",
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount: 1
        }]
    ),
    registerUser);

router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refreshToken", refreshAccessToken);
router.post("/changePassword", verifyJWT, changePassword);
router.get("/getUser", verifyJWT, getUser);
router.patch("/updateUserDetails", verifyJWT, updateUserDetails);
router.patch("/updateAvatar", 
    verifyJWT, 
    upload.single("avatar"), 
    updateAvatar
);

router.patch("/updateCoverImage", 
    verifyJWT, 
    upload.single("coverImage"), 
    updateCoverImage
);

router.get("/getChannel/:username", verifyJWT, getChannel);

router.get("/history", verifyJWT, getWatchHistory);

export default router;