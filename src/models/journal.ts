import mongoose from "mongoose";

// Journal Entry Schema
interface JournalEntryInterface {
    journalEntry:string,
    date:Date, /* Date format : Date.toISOString() */
    dateCreated:Date, /* Date format : Date.toISOString() */
    dateEdited:Date, /* Date format : Date.toISOString() */
    clientSelectedDayStartTime:number,
    clientTimezoneOffset:number,
    _id:string
}
const journalEntrySchema = new mongoose.Schema<JournalEntryInterface>({
    journalEntry:{type:String,required:true},
    date:{type:Date,required:true},
    dateCreated:{type:Date,required:true},
    dateEdited:{type:Date,required:true},
})

// Journal Schema
interface Journal {
    userId:string
    user:string,
    journalEntries:JournalEntryInterface[]
}
const journalSchema = new mongoose.Schema<Journal>({
    userId:{type:String,required:true},
    user:{type:String,required:true},
    journalEntries:[journalEntrySchema]
})

const JournalEntry = mongoose.model<JournalEntryInterface>('Journal Entry',journalEntrySchema);
const Journal = mongoose.model<Journal>('Journal',journalSchema);

export {Journal,JournalEntry,JournalEntryInterface}