// require('dotenv').config();
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
        path:'./env'
});


connectDB()
        .then(() => {
                app.listen(process.env.PORT || 5000, () => {
                        console.log(`server is running on ${process.env.PORT}`)
                })
                        
             
        })
        .catch((err)=> {
        console.log("MONGODB connection failed or break!!",err)
})

















      /* 
      import express from "express" ;
       const app = express();
      ; (async() => {
                    try {
                        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
                              app.on('error', (err) => {
                                        console.log("mongodb error", err);
                                        throw err;
                              })
                              
                              app.listen(process.env.PORT,() => {
                                      console.log(`app is running on port ${process.env.PORT}`)  
                              })
                    } catch (error) {
                              console.log("db error", error)
                              throw err
          }
})()*/