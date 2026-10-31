import mongoose from "mongoose";

let currentMongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fb_page_automation";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export function getMongoUri(): string {
  return currentMongoUri;
}

export function setMongoUri(uri: string): void {
  currentMongoUri = uri.trim();
  // Clear cached connection when URI is updated
  if (cached.conn) {
    cached.conn.disconnect().catch(() => {});
  }
  cached.conn = null;
  cached.promise = null;
}

export function maskMongoUri(uri: string): string {
  if (!uri) return "";
  try {
    // Mask password in mongodb://user:pass@host/db or mongodb+srv://...
    return uri.replace(
      /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i,
      "$1••••••••$3"
    );
  } catch {
    return uri;
  }
}

/**
 * Test a MongoDB connection string without overriding the main cached connection unless requested
 */
export async function testMongoConnection(
  testUri?: string
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const uriToTest = testUri || currentMongoUri;
  const startTime = Date.now();

  try {
    const conn = await mongoose.createConnection(uriToTest, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 10000,
    }).asPromise();

    const latencyMs = Date.now() - startTime;
    await conn.close();

    return {
      success: true,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const error = err as Error;
    return {
      success: false,
      latencyMs,
      error: error.message || "Failed to reach MongoDB server",
    };
  }
}

/**
 * Connect to MongoDB with connection pooling optimized for serverless environments.
 */
export async function connectToDatabase(
  forceUri?: string
): Promise<typeof mongoose> {
  if (forceUri && forceUri !== currentMongoUri) {
    setMongoUri(forceUri);
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(currentMongoUri, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
