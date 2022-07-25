import express from "express";
const router = express.Router();
const {getHabits,getArchivedHabits,addNewHabit,updateHabitEntryStatus,updateHabit,populateHabit,updateHabitArchiveStatus,deleteHabit} = require('../controllers/habit-controllers');
const {lastOnline} = require('../controllers/user-controllers');
const {authCheck} = require('../middleware/auth-check');

router.post('/getHabits',authCheck,lastOnline,getHabits)

router.post('/getArchivedHabits',authCheck,lastOnline,getArchivedHabits)

router.post('/addNewHabit',authCheck,lastOnline,addNewHabit)

router.patch('/updateHabitEntryStatus',authCheck,lastOnline,updateHabitEntryStatus)

router.patch('/updateHabit',authCheck,lastOnline,updateHabit)

router.patch('/populateHabit',authCheck,lastOnline,populateHabit)

router.patch('/updateHabitArchiveStatus',authCheck,lastOnline,updateHabitArchiveStatus)

router.delete('/deleteHabit',authCheck,lastOnline,deleteHabit)

module.exports = router 