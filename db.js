const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50, // Increase connection pool for better concurrent performance
    minPoolSize: 10, // Minimum connections to maintain
    socketTimeoutMS: 30000, // Socket timeout
    connectTimeoutMS: 10000, // Connection timeout
    serverSelectionTimeoutMS: 5000, // Server selection timeout
    heartbeatFrequencyMS: 10000, // Heartbeat frequency
    retryWrites: true,
    retryReads: true
};

async function connectToDB() {
    if (isConnected) {
        console.log('📡 Using existing database connection');
        return;
    }

    try {
        // Get MongoDB URI from environment variable or use default
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Data-Association';

        // Create the connection
        await mongoose.connect(MONGODB_URI, connectOptions);
        
        isConnected = true;
        console.log('✅ Database connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('❌ MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
            isConnected = true;
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('✅ MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('❌ Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });

    } catch (err) {
        console.error('❌ Database connection failed:', err);
        // Implement exponential backoff for reconnection
        setTimeout(() => {
            console.log('🔄 Attempting to reconnect to database...');
            connectToDB();
        }, 5000);
        throw err;
    }
}

// Export both the connection function and the connection status
module.exports = {
    connectToDB,
    isConnected: () => isConnected,
    getConnection: () => mongoose.connection
}; 