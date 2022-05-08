"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getHabits, getArchivedHabits, addNewHabit, updateHabitEntryStatus, updateHabit, populateHabit, updateHabitArchiveStatus, deleteHabit } = require('../controllers/habit-controllers');
const { authCheck } = require('../middleware/auth-check');
router.post('/getHabits', authCheck, getHabits);
router.post('/getArchivedHabits', authCheck, getArchivedHabits);
router.post('/addNewHabit', authCheck, addNewHabit);
router.patch('/updateHabitEntryStatus', authCheck, updateHabitEntryStatus);
router.patch('/updateHabit', authCheck, updateHabit);
router.patch('/populateHabit', authCheck, populateHabit);
router.patch('/updateHabitArchiveStatus', authCheck, updateHabitArchiveStatus);
router.delete('/deleteHabit', authCheck, deleteHabit);
module.exports = router;
