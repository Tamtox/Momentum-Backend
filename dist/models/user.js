"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, require: true, minlength: 6 },
    creationDate: { type: String, required: true },
    emailConfirmationStatus: { type: String, required: true, default: "Pending" },
    verificationCode: { type: String, required: true }
});
module.exports = mongoose_1.default.model('User', userSchema);
