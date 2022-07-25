import express from "express";
const router = express.Router();
const {getGoals,getArchivedGoals,addNewGoal,updateGoal,deleteGoal} = require('../controllers/goal-controllers');
const {lastOnline} = require('../controllers/user-controllers');
const {authCheck} = require('../middleware/auth-check');

router.get('/getGoals',authCheck,lastOnline,getGoals)

router.get('/getArchivedGoals',authCheck,lastOnline,getArchivedGoals)

router.post('/addNewGoal',authCheck,lastOnline,addNewGoal)

router.patch('/updateGoal',authCheck,lastOnline,updateGoal)

router.delete('/deleteGoal',authCheck,lastOnline,deleteGoal)

module.exports = router 