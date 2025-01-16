import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"
import { publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus, getAllVideos } from "../controllers/video.controllers.js";

const router = Router();

router.use(verifyJWT);

router
.post("/publishAVideo",
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        }
    ]) ,
    publishAVideo);

router.get('/id/:videoId',getVideoById);
router.post('/updateVideo/:videoId', upload.single("thumbnail") ,updateVideo);
router.delete('/deleteVideo/:videoId',deleteVideo);
router.get('/togglePublishStatus/:videoId',togglePublishStatus);
router.get('/getAllVideos',getAllVideos);

export default router;