import express from "express";
const router = express.Router();
const {getHabits,getArchivedHabits,addNewHabit,updateHabitEntryStatus,updateHabit,updateHabitArchiveStatus,deleteHabit} = require('../controllers/habit-controllers');
const {authCheck} = require('../middleware/auth-check');

router.post('/getHabits',authCheck,getHabits)

router.post('/getArchivedHabits',authCheck,getArchivedHabits)

router.post('/addNewHabit',authCheck,addNewHabit)

router.patch('/updateHabitEntryStatus',authCheck,updateHabitEntryStatus)

router.patch('/updateHabit',authCheck,updateHabit)

router.patch('/updateHabitArchiveStatus',authCheck,updateHabitArchiveStatus)

router.delete('/deleteHabit',authCheck,deleteHabit)

module.exports = router 