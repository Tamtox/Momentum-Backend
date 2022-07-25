"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const journalEntrySchema = new mongoose_1.default.Schema({
    journalEntry: { type: String, required: true },
    date: { type: Date, required: true },
});
const journalSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    user: { type: String, required: true },
    journalEntries: [journalEntrySchema]
});
const JournalEntry = mongoose_1.default.model('Journal Entry', journalEntrySchema);
const Journal = mongoose_1.default.model('Journal', journalSchema);
exports.Journal = Journal;
exports.JournalEntry = JournalEntry;
