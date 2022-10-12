import express from "express";
const router = express.Router();
const {authCheck} = require('../middleware/auth-check');
const {getSchedule,addScheduleItem,updateScheduleItem,updateScheduleItemStatus,deleteScheduleItem} = require('../controllers/schedule-controllers');

router.post('/getSchedule',authCheck,getSchedule);

// router.post('/addScheduleItem',authCheck,addScheduleItem);

// router.patch('/updateScheduleItem',authCheck,updateScheduleItem);

router.patch('/updateScheduleItemStatus',authCheck,updateScheduleItemStatus);

// router.post('/deleteScheduleItem',authCheck,deleteScheduleItem);

module.exports = router;