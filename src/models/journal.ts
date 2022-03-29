import mongoose from "mongoose";

// Journal Entry Schema
interface JournalEntry {
    journalEntry:string,
    date:string
}
const journalEntrySchema = new mongoose.Schema<JournalEntry>({
    journalEntry:{type:String,required:true},
    date:{type:String,required:true} /* Date format : "date/month/year" */
})

// Journal Schema
interface Journal {
    _id:string
    user:string,
    journalEntries:JournalEntry[]
}
const journalSchema = new mongoose.Schema<Journal>({
    _id:{type:String,required:true},
    user:{type:String,required:true},
    journalEntries:[journalEntrySchema]
})

const JournalEntry = mongoose.model<JournalEntry>('Journal Entry',journalEntrySchema);
const Journal = mongoose.model<Journal>('Journal',journalSchema);

exports.Journal = Journal;
exports.JournalEntry = JournalEntry;