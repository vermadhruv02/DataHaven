import dotenv from 'dotenv';
import  connectToDatabase from './db/index.js';

dotenv.config();
connectToDatabase();