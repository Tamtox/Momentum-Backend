"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getGoals, getArchivedGoals, addNewGoal, updateGoal, deleteGoal } = require('../controllers/goal-controllers');
const { lastOnline } = require('../controllers/user-controllers');
const { authCheck } = require('../middleware/auth-check');
router.get('/getGoals', authCheck, lastOnline, getGoals);
router.get('/getArchivedGoals', authCheck, lastOnline, getArchivedGoals);
router.post('/addNewGoal', authCheck, lastOnline, addNewGoal);
router.patch('/updateGoal', authCheck, lastOnline, updateGoal);
router.delete('/deleteGoal', authCheck, lastOnline, deleteGoal);
module.exports = router;
