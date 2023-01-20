"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const habit_controllers_1 = require("../controllers/habit-controllers");
const user_controllers_1 = require("../controllers/user-controllers");
const auth_check_1 = require("../middleware/auth-check");
router.post('/getHabits', auth_check_1.authCheck, user_controllers_1.lastOnline, habit_controllers_1.getHabits);
router.post('/getArchivedHabits', auth_check_1.authCheck, user_controllers_1.lastOnline, habit_controllers_1.getArchivedHabits);
router.post('/addNewHabit', auth_check_1.authCheck, user_controllers_1.lastOnline, habit_controllers_1.addNewHabit);
router.patch('/updateHabitEntryStatus', auth_check_1.authCheck, user_controllers_1.lastOnline, habit_controllers_1.updateHabitEntryStatus);
router.patch('/updateHabit', auth_check_1.authCheck, user_controllers_1.lastOnline, habit_controllers_1.updateHabit);
router.patch('/populateHabit', auth_check_1.authCheck, user_controllers_1.lastOnline, habit_controllers_1.populateHabit);
router.patch('/updateHabitArchiveStatus', auth_check_1.authCheck, user_controllers_1.lastOnline, habit_controllers_1.updateHabitArchiveStatus);
router.delete('/deleteHabit', auth_check_1.authCheck, user_controllers_1.lastOnline, habit_controllers_1.deleteHabit);
module.exports = router;
//# sourceMappingURL=habit-routes.js.map