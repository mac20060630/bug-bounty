import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { seedDefaultDataIfEmpty } from '../services/seedService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_DIR = path.join(__dirname, '..', 'data', 'db');

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugbounty';

  try {
    // Attempt standard connection with 2-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${mongoose.connection.host}`);
    await seedDefaultDataIfEmpty();
  } catch (err) {
    console.log(`[Database] Standard MongoDB daemon not detected at ${uri}.`);

    // In development or test mode, run embedded local MongoDB right on the laptop
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Initializing embedded local MongoDB on laptop disk...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');

        const serverOptions = {};
        // If not in automated test runner, persist database data to server/data/db
        if (process.env.NODE_ENV !== 'test') {
          if (!fs.existsSync(LOCAL_DB_DIR)) {
            fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
          }
          serverOptions.instance = {
            dbPath: LOCAL_DB_DIR,
            storageEngine: 'wiredTiger',
          };
        }

        mongoMemoryServer = await MongoMemoryServer.create(serverOptions);
        const memUri = mongoMemoryServer.getUri();
        await mongoose.connect(memUri);
        console.log(`[Database] Embedded Local MongoDB connected successfully at ${memUri}`);
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[Database] Data stored locally on disk at: server/data/db`);
          await seedDefaultDataIfEmpty();
        }
      } catch (memErr) {
        console.error('[Database] Failed to initialize embedded MongoDB:', memErr.message);
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
