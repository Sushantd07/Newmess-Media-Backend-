import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        // Check if MONGODB_URL already contains a database name
        const mongoUrl = process.env.MONGODB_URL;
        let connectionString;
        
        if (mongoUrl.includes('/' + DB_NAME) || mongoUrl.includes('/' + DB_NAME + '?')) {
            // URL already contains the database name
            connectionString = mongoUrl;
        } else {
            // Append database name to URL
            connectionString = `${mongoUrl}/${DB_NAME}`;
        }

        const connectionInstance = await mongoose.connect(connectionString);
        // console.log(`✅ MongoDB Connected! Host: ${connectionInstance.connection.host}`);
        console.log("DB Connected Sucessfully.")
    } catch (error) {
        console.log("MONGODB Connection failed",error)
        process.exit(1);
    }
}

export default connectDB