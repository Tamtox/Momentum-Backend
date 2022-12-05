import express from "express";
const router = express.Router();
import { getJournalEntry,updateJournalEntry } from "../controllers/journal-controllers";
import { lastOnline } from "../controllers/user-controllers";
import { authCheck } from "../middleware/auth-check";

router.post('/getJournalEntry',authCheck,lastOnline,getJournalEntry)

router.patch('/updateJournalEntry',authCheck,lastOnline,updateJournalEntry)

module.exports = router 