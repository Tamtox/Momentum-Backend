import express from "express";
const router = express.Router();
const {getGoals,getArchivedGoals,addNewGoal,updateGoal,deleteGoal} = require('../controllers/goal-controllers');
const {authCheck} = require('../middleware/auth-check');

router.get('/getGoals',authCheck,getGoals)

router.get('/getArchivedGoals',authCheck,getArchivedGoals)

router.post('/addNewGoal',authCheck,addNewGoal)

router.patch('/updateGoal',authCheck,updateGoal)

router.delete('/deleteGoal',authCheck,deleteGoal)

module.exports = router 