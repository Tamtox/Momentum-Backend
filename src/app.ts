import express,{ Request,Response,NextFunction } from "express";
import * as dotenv from 'dotenv';
dotenv.config();
process.env.TZ = 'Etc/Universal';
const mongoose = require("mongoose");
const { MONGO_URI,PORT,MONGO_URIATLAS } = process.env;
const app = express();

const userRoutes = require('./routes/user-routes');
const scheduleRoutes = require('./routes/schedule-routes');
const todoRoutes = require('./routes/todo-routes');
const habitRoutes = require('./routes/habit-routes');
const journalRoutes = require('./routes/journal-routes');
const goalRoutes = require('./routes/goal-routes');

// Encoders
app.use(express.urlencoded({extended:true}));
app.use(express.json());

// Headers config
app.use((req:Request,res:Response,next:NextFunction)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE');
    next()
})

//Routes 
app.use('/users',userRoutes);
app.use('/schedule',scheduleRoutes);
app.use('/todo',todoRoutes);
app.use('/habits',habitRoutes);
app.use('/journal',journalRoutes);
app.use('/goals',goalRoutes);

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


mongoose
.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("Successfully connected to database");
    app.listen(PORT);
    console.log("Server Up")
})
.catch((error:Error) => {
    console.log("Database connection failed. exiting now...");
    console.error(error);
});
