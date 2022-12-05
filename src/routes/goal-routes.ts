import express from "express";
const router = express.Router();
import { getGoals,getArchivedGoals,addNewGoal,updateGoal,deleteGoal } from "../controllers/goal-controllers";
import { lastOnline } from "../controllers/user-controllers";
import {authCheck} from "../middleware/auth-check"

router.get('/getGoals',authCheck,lastOnline,getGoals)
router.get('/getArchivedGoals',authCheck,lastOnline,getArchivedGoals)
router.post('/addNewGoal',authCheck,lastOnline,addNewGoal)
router.patch('/updateGoal',authCheck,lastOnline,updateGoal)
router.delete('/deleteGoal',authCheck,lastOnline,deleteGoal)

module.exports = router 