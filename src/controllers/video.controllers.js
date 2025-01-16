import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = "1",
        limit = "10",
        query,
        sortBy,
        sortType,
        userId,
    } = req.query;
    //TODO: get all videos based on query, sort, pagination

    const sortByField = ["uploadedAt", "duration", "views"];
    const sortDirection = ["asc", "desc"];

    if (!sortByField.includes(sortBy))
        throw new ApiError(400, "sort by field is not given");
    if (!sortDirection.includes(sortType))
        throw new ApiError(400, "sort type direction is not given");

    if (!userId)
        throw new ApiError(400, "userId is not given");

    if (!isValidObjectId(userId))
        throw new ApiError(400, "Invalid userId");

        const videos = Video.aggregate([
            {
              $match: {
                $or: [
                  {
                    owner: userId ? new mongoose.Types.ObjectId(userId) : null,
                  },
                  {
                    $and: [
                      { isPublished: true },
                      {
                        $or: [
                          {
                            title: query
                              ? { $regex: query, $options: "i" }
                              : { $exists: true },
                          },
                          {
                            description: query
                              ? { $regex: query, $options: "i" }
                              : null,
                          },
                        ],
                      },
                    ],
                  },
                ],
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
            {
              $sort: {
                [sortBy]: sortType === "dsc" ? -1 : 1,
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",
                },
              },
            },
          ]);

    const limitedVideos = await Video.aggregatePaginate(videos, {
        page,
        limit,
        customLabels: {
            totalDocs: "totalVideos",
            docs: "Videos",
        },
        allowDiskUse: true,
    });

    if(limitedVideos.totalVideos === 0) throw new ApiError(404, "Videos not found");
    
    res.status(200).json(new ApiResponse(200, limitedVideos.Videos, "videos has been sent"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if ([title, description].some((field) => field.trim() === ""))
        throw new ApiError(400, "all fields is required");

    const localVideoFilePath = req.files?.videoFile[0]?.path;
    const localThumbnailPath = req.files?.thumbnail[0]?.path;

    if (!localVideoFilePath)
        throw new ApiError(405, "localVideoFilePath is required");
    if (!localThumbnailPath)
        throw new ApiError(405, "localThumbnailPath is required");

    const videoFile = await uploadOnCloudinary(localVideoFilePath);
    const thumbnail = await uploadOnCloudinary(localThumbnailPath);
    // console.log('videoFile , thumbnail :>> ', videoFile , thumbnail);

    if ([videoFile, thumbnail].some((field) => field === null || field === ""))
        throw new ApiError(400, "video or thumbnail are required");

    // console.log('videoFile', videoFile);
    const video = await Video.create({
        title,
        description,
        owner: req.user._id,
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        duration: videoFile.duration,
    });
    if (!video)
        throw new ApiError(500, "Internal server error video not uploded");

    res.status(200).json(new ApiResponse(200, video, "video file link send"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId))
        throw new ApiError(400, "video ID was not Valid ");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "video was not found ");

    res.status(200).json(new ApiResponse(200, video, "video file link send"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId))
        throw new ApiError(400, "video ID was not Valid ");

    const video = await Video.findById(videoId);
    if (video.owner.toString() !== req.user._id.toString())
        throw new ApiError(400, "Unauthorised Request, owner is some one else");
    if (!video) throw new ApiError(400, "video was not found ");

    const { title, description } = req.body;
    if ([title, description].some((field) => field.trim() === ""))
        throw new ApiError(409, "title and description are required");

    video.title = title;
    video.description = description;

    const localThumbnailPath = req?.file?.path;
    if (localThumbnailPath) {
        console.log("localThumbnailPath :>> ", localThumbnailPath);
        const thumbnail = await uploadOnCloudinary(localThumbnailPath);
        video.thumbnail = thumbnail.url;
    }
    await video.save({ validate: false });

    res.status(200).json(
        new ApiResponse(200, video, "video details are updated")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId))
        throw new ApiError(400, "video ID was not Valid ");

    //TODO: delete video
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) throw new ApiError(400, "video not found, invalid videoId");
    // console.log("video :>> ", video);

    res.status(200).json(new ApiResponse(200, video, "video is deleted."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId))
        throw new ApiError(400, "video ID was not Valid ");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "video was not found ");

    video.isPublished = !video.isPublished;
    video.save({ validate: false });

    res.status(200).json(
        new ApiResponse(200, video, "Publish video status change")
    );
});

export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos,
};
