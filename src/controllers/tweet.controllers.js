import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.modle.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content.trim()) throw new ApiError(400, "content is required!");

    const tweet = await Tweet.create({
        owner: req.user._id,
        content,
    });
    if (!tweet) throw new ApiError(500, "tweet was not stored!");

    res.status(200).json(new ApiResponse(200, tweet, "tweet saved"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: req.user._id,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        // {
        //     $addFields: {
        //         owner: {
        //             $first: "$owner",
        //         },
        //     },
        // },
        {
            $unwind: "$owner",
        },
    ]);

    if (!tweets || tweets.length === 0)
        throw new ApiError(400, "tweet not found");
    res.status(200).json(
        new ApiResponse(200, tweets, "tweets sent sucessfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!tweetId) throw new ApiError(400, "tweetId is required!");
    if (!isValidObjectId(tweetId))
        throw new ApiError(400, "tweetId is not valid");

    const tweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user._id },
        { $set: { content } },
        { new: true }
    ).populate({
        path: "owner",
        select: "-password -refreshToken -email -watchHistory -coverImage -createdAt -updatedAt -__v",
    });

    if (!tweet)
        throw new ApiError(400, "Tweet not found or user is not the owner");

    res.status(200).json(
        new ApiResponse(200, tweet, "tweet updated sucessfully")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!tweetId) throw new ApiError(400, "tweetId is required!");
    if (!isValidObjectId(tweetId))
        throw new ApiError(400, "tweetId is not valid");

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id,
    });

    if (!deletedTweet)
        throw new ApiError(
            400,
            "user is not the owner of this tweet or the tweet does not exists"
        );

        res.status(200).json(
        new ApiResponse(200, deletedTweet, "tweet deleted sucessfully")
    );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
