"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const user_controllers_1 = require("../controllers/user-controllers");
const auth_check_1 = require("../middleware/auth-check");
router.post('/signup', user_controllers_1.signup);
router.post('/login', user_controllers_1.login);
router.post('/verify', auth_check_1.authCheck, user_controllers_1.lastOnline, user_controllers_1.verifyUser);
router.get('/getUserData', auth_check_1.authCheck, user_controllers_1.lastOnline, user_controllers_1.getUserData);
router.post('/sendVerificationLetter', auth_check_1.authCheck, user_controllers_1.lastOnline, user_controllers_1.sendVerificationLetter);
router.patch('/changePassword', auth_check_1.authCheck, user_controllers_1.lastOnline, user_controllers_1.changePassword);
router.patch('/resetPassword', user_controllers_1.resetPassword);
router.delete('/delete', auth_check_1.authCheck, user_controllers_1.deleteUser);
module.exports = router;
//# sourceMappingURL=user-routes.js.map