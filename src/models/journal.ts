import mongoose from "mongoose";

// Journal Entry Schema
interface JournalEntry {
    journalEntry:string,
    date:Date, /*Date format: yyyy-MM-dd HH:mm:ss*/
}
const journalEntrySchema = new mongoose.Schema<JournalEntry>({
    journalEntry:{type:String,required:true},
    date:{type:Date,required:true},
})

// Journal Schema
interface Journal {
    userId:string
    user:string,
    journalEntries:JournalEntry[]
}
const journalSchema = new mongoose.Schema<Journal>({
    userId:{type:String,required:true},
    user:{type:String,required:true},
    journalEntries:[journalEntrySchema]
})

const JournalEntry = mongoose.model<JournalEntry>('Journal Entry',journalEntrySchema);
const Journal = mongoose.model<Journal>('Journal',journalSchema);

exports.Journal = Journal;
exports.JournalEntry = JournalEntry;