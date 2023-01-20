"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const journal_controllers_1 = require("../controllers/journal-controllers");
const user_controllers_1 = require("../controllers/user-controllers");
const auth_check_1 = require("../middleware/auth-check");
router.post('/getJournalEntry', auth_check_1.authCheck, user_controllers_1.lastOnline, journal_controllers_1.getJournalEntry);
router.patch('/updateJournalEntry', auth_check_1.authCheck, user_controllers_1.lastOnline, journal_controllers_1.updateJournalEntry);
module.exports = router;
//# sourceMappingURL=journal-routes.js.map