import express from "express";
const router = express.Router();
const {authCheck} = require('../middleware/auth-check');
const {getNotifications,updateNotificationStatus} = require('../controllers/notification-controllers');

router.post('/getNotifications',authCheck,getNotifications);

router.patch('/updateNotificationStatus',authCheck,updateNotificationStatus);

module.exports = router 