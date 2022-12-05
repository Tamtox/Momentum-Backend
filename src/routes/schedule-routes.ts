import express from "express";
const router = express.Router();
import { getSchedule,updateScheduleItemStatus } from "../controllers/schedule-controllers";
import { authCheck } from "../middleware/auth-check";

router.post('/getSchedule',authCheck,getSchedule);
router.patch('/updateScheduleItemStatus',authCheck,updateScheduleItemStatus);

module.exports = router;