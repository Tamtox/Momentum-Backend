"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getGoals, addNewGoal, updateGoal, deleteGoal } = require('../controllers/goal-controllers');
const { authCheck } = require('../middleware/auth-check');
router.get('/getGoals', authCheck, getGoals);
router.post('/addNewGoal', authCheck, addNewGoal);
router.patch('/updateGoal', authCheck, updateGoal);
router.delete('/deleteGoal', authCheck, deleteGoal);
module.exports = router;
