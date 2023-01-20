"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const goal_controllers_1 = require("../controllers/goal-controllers");
const user_controllers_1 = require("../controllers/user-controllers");
const auth_check_1 = require("../middleware/auth-check");
router.get('/getGoals', auth_check_1.authCheck, user_controllers_1.lastOnline, goal_controllers_1.getGoals);
router.get('/getArchivedGoals', auth_check_1.authCheck, user_controllers_1.lastOnline, goal_controllers_1.getArchivedGoals);
router.post('/addNewGoal', auth_check_1.authCheck, user_controllers_1.lastOnline, goal_controllers_1.addNewGoal);
router.patch('/updateGoal', auth_check_1.authCheck, user_controllers_1.lastOnline, goal_controllers_1.updateGoal);
router.delete('/deleteGoal', auth_check_1.authCheck, user_controllers_1.lastOnline, goal_controllers_1.deleteGoal);
module.exports = router;
//# sourceMappingURL=goal-routes.js.map