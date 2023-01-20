"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntry = exports.Journal = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const journalEntrySchema = new mongoose_1.default.Schema({
    journalEntry: { type: String, required: true },
    date: { type: Date, required: true },
    dateCreated: { type: Date, required: true },
    dateEdited: { type: Date, required: true },
});
const journalSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    user: { type: String, required: true },
    journalEntries: [journalEntrySchema]
});
const JournalEntry = mongoose_1.default.model('Journal Entry', journalEntrySchema);
exports.JournalEntry = JournalEntry;
const Journal = mongoose_1.default.model('Journal', journalSchema);
exports.Journal = Journal;
//# sourceMappingURL=journal.js.map