import express from "express";
const router = express.Router();
const {authCheck} = require('../middleware/auth-check');
const {getSchedule,updateScheduleItemStatus} = require('../controllers/schedule-controllers');

router.post('/getSchedule',authCheck,getSchedule);

router.patch('/updateScheduleItemStatus',authCheck,updateScheduleItemStatus);

module.exports = router 