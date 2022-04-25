"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getJournalEntry, updateJournalEntry } = require('../controllers/journal-controllers');
const { authCheck } = require('../middleware/auth-check');
router.post('/getJournalEntry', authCheck, getJournalEntry);
router.patch('/updateJournalEntry', authCheck, updateJournalEntry);
module.exports = router;
