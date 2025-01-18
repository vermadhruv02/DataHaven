import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // TODO: toggle subscription
    if (!channelId) throw new ApiError(400, "channelId is required ");

    let isSubscriber = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });
    if (isSubscriber) {
        const unsuscribe = await Subscription.findByIdAndDelete(
            isSubscriber._id
        );
        return res
            .status(200)
            .json(new ApiResponse(200, unsuscribe, "unsuscribed sucessfully"));
    }
    const subscriber = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, subscriber, "subscribed sucessfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId || !isValidObjectId(channelId))
        throw new ApiError(400, "invalid channelId");

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        // {
        //     $lookup:{
        //         from:"users",
        //         localField:"channel",
        //         foreignField:"_id",
        //         as:"channel",
        //         pipeline:[
        //             {
        //                 $project:{
        //                     fullName: 1,
        //                     username: 1,
        //                     avatar:1,
        //                 }
        //             }
        //         ]
        //     }
        // },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
        {
            $unwind: "$subscriber",
        },
        // {
        //     $unwind: "$channel",
        // }
    ]);
    if (subscriberList.length === 0) {
        throw new ApiError(400, "No subscribers found for this channel");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, subscriberList, "subscriber list sucessfully")
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!subscriberId || !isValidObjectId(subscriberId))
        throw new ApiError(400, "invalid subscriberId");

    const ChannelList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            fullName: 1,
                            username: 1,
                            avatar:1,
                        }
                    }
                ]
            }
        },
        // {
        //     $lookup: {
        //         from: "users",
        //         localField: "subscriber",
        //         foreignField: "_id",
        //         as: "subscriber",
        //         pipeline: [
        //             {
        //                 $project: {
        //                     fullName: 1,
        //                     username: 1,
        //                     avatar: 1,
        //                 },
        //             },
        //         ],
        //     },
        // },
        // {
        //     $unwind: "$subscriber",
        // },
        {
            $unwind: "$channel",
        }
    ]);
    if (ChannelList.length === 0) {
        throw new ApiError(400, "No subscribers found for this channel");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, ChannelList, "subscriber list sucessfully")
        );
    
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
