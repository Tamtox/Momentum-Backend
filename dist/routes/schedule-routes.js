"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const schedule_controllers_1 = require("../controllers/schedule-controllers");
const auth_check_1 = require("../middleware/auth-check");
router.post('/getSchedule', auth_check_1.authCheck, schedule_controllers_1.getSchedule);
router.patch('/updateScheduleItemStatus', auth_check_1.authCheck, schedule_controllers_1.updateScheduleItemStatus);
module.exports = router;
//# sourceMappingURL=schedule-routes.js.map