import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
} from "../controllers/tweet.controllers.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/createTweet", createTweet);
router.get("/getUserTweets", getUserTweets);
router.patch("/updateTweet/:tweetId", updateTweet);
router.delete("/deleteTweet/:tweetId", deleteTweet);

export default router;
