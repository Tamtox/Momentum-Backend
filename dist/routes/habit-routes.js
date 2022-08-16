"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getHabits, getArchivedHabits, addNewHabit, updateHabitEntryStatus, updateHabit, populateHabit, updateHabitArchiveStatus, deleteHabit } = require('../controllers/habit-controllers');
const { lastOnline } = require('../controllers/user-controllers');
const { authCheck } = require('../middleware/auth-check');
router.post('/getHabits', authCheck, lastOnline, getHabits);
router.post('/getArchivedHabits', authCheck, lastOnline, getArchivedHabits);
router.post('/addNewHabit', authCheck, lastOnline, addNewHabit);
router.patch('/updateHabitEntryStatus', authCheck, lastOnline, updateHabitEntryStatus);
router.patch('/updateHabit', authCheck, lastOnline, updateHabit);
router.patch('/populateHabit', authCheck, lastOnline, populateHabit);
router.patch('/updateHabitArchiveStatus', authCheck, lastOnline, updateHabitArchiveStatus);
router.delete('/deleteHabit', authCheck, lastOnline, deleteHabit);
module.exports = router;