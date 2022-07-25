import express from "express";
const router = express.Router();
const {authCheck} = require('../middleware/auth-check');
const {getNotifications,addNotification,updateNotification,updateNotificationStatus,deleteNotification} = require('../controllers/notification-controllers');

router.post('/getNotifications',authCheck,getNotifications);

router.post('/addNotification',authCheck,addNotification);

router.patch('/updateNotification',authCheck,updateNotification);

router.patch('/updateNotificationStatus',authCheck,updateNotificationStatus);

router.delete('/deleteNotification',authCheck,deleteNotification);

module.exports = router 