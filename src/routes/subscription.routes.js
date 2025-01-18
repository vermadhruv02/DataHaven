import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} from "../controllers/subscription.controllers.js";

const router = Router();

router.use(verifyJWT);

router.get("/toggleSubscription/:channelId", toggleSubscription);
router.get("/getUserChannelSubscribers/:channelId", getUserChannelSubscribers);
router.get("/getSubscribedChannels/:subscriberId", getSubscribedChannels);

export default router;