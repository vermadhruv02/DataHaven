import mongoose from 'mongoose';
import { DatabaseName } from '../constants.js';


const connectToDatabase = async () => {
  try {
    
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DatabaseName}`);

    console.log(`Connected to the database successfully at ${connectionInstance.connection.host} at ${connectionInstance.connection.name}`);
    // console.log(connectionInstance.connection );

  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
};

export default connectToDatabase;

