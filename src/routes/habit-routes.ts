import express from "express";
const router = express.Router();
const {getHabits,addNewHabit,updateHabitEntryStatus,updateHabit,deleteHabit} = require('../controllers/habit-controllers');
const {authCheck} = require('../middleware/auth-check');

router.post('/getHabits',authCheck,getHabits)

router.post('/addNewHabit',authCheck,addNewHabit)

router.patch('/updateHabitEntryStatus',authCheck,updateHabitEntryStatus)

router.patch('/updateHabit',authCheck,updateHabit)

router.delete('/deleteHabit',authCheck,deleteHabit)

module.exports = router 