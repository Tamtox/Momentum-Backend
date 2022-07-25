"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { signup, login, verifyUser, getUserData, sendVerificationLetter, changePassword, resetPassword, deleteUser, lastOnline } = require('../controllers/user-controllers');
const { authCheck } = require('../middleware/auth-check');
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify', authCheck, lastOnline, verifyUser);
router.get('/getUserData', authCheck, lastOnline, getUserData);
router.post('/sendVerificationLetter', authCheck, lastOnline, sendVerificationLetter);
router.patch('/changePassword', authCheck, lastOnline, changePassword);
router.patch('/resetPassword', resetPassword);
router.delete('/delete', authCheck, deleteUser);
module.exports = router;
