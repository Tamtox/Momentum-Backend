import express,{ Request,Response,NextFunction } from "express";
import 'dotenv/config';
process.env.TZ = 'Etc/Universal';
const mongoose = require("mongoose")
const { MONGO_URL,PORT,MONGO_ATLAS_USERNAME,MONGO_ATLAS_PASS } = process.env;
const app = express();
const path = require('path');

// CORS Headers config
app.use((req:Request,res:Response,next:NextFunction)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','*');
    next();
})

const userRoutes = require('./routes/user-routes');
const scheduleRoutes = require('./routes/schedule-routes');
const todoRoutes = require('./routes/todo-routes');
const habitRoutes = require('./routes/habit-routes');
const journalRoutes = require('./routes/journal-routes');
const goalRoutes = require('./routes/goal-routes');


// Encoders
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const mongoAtlasPass = encodeURIComponent(`${MONGO_ATLAS_PASS}`);

// API Routes 
app.use('/users',userRoutes);
app.use('/schedule',scheduleRoutes);
app.use('/todo',todoRoutes);
app.use('/habits',habitRoutes);
app.use('/journal',journalRoutes);
app.use('/goals',goalRoutes);

// Static
app.use((req:Request,res:Response)=> {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Unknown routes
app.use((req:Request,res:Response,next:NextFunction)=>{
    return res.status(404).send("Route doesn't exist");
})

app.use((error:Error,req:Request,res:Response,next:NextFunction)=>{
    if(res.headersSent) {
        return next(error);
    }
    res.json({message:error.message||'Unknown error'});
})

async function momentumStart() {
    try{
        await mongoose.connect(`mongodb+srv://${MONGO_ATLAS_USERNAME}:${mongoAtlasPass}@cluster0.rqrzn.mongodb.net/momentum?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true });
        app.listen(PORT || 8080);
        console.log(`Server up at port ${PORT || 8080}`);
    } catch(error) {
        console.log("Database connection failed. exiting now...");
        console.error(error);
    }
}

momentumStart();
