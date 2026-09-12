import mongoose from 'mongoose';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugbounty';

  try {
    // Attempt standard connection with 3-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to external MongoDB at ${uri}: ${err.message}`);

    // In development or test mode, fall back to in-memory MongoDB so the app runs out-of-the-box
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Initializing in-memory MongoDB instance for development/testing...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        await mongoose.connect(memUri);
        console.log(`[Database] In-memory MongoDB connected successfully at ${memUri}`);
      } catch (memErr) {
        console.error('[Database] Failed to initialize in-memory MongoDB:', memErr.message);
        throw memErr;
      }
    } else {
      throw err;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (err) {
    console.error('[Database] Error during disconnect:', err.message);
  }
};
