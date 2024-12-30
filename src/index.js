import dotenv from 'dotenv';
import  connectToDatabase from './db/index.js';
import app from './app.js';


dotenv.config();

connectToDatabase()
.then(() => {
    app.on('error', (error) => {
        console.log("Their is an error",error);
        throw error;
    })
    app.listen(process.env.PORT, () => {
        console.log(`Server is listening on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.log("catched connect to database error:",error);
    throw error;
});