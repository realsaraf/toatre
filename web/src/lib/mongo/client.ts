import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Module-level cache for production (one per worker process).
let _prodClientPromise: Promise<MongoClient> | null = null;

const options = {
  maxPoolSize: 5,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (process.env.NODE_ENV === "development") {
    // In dev, use a global so the client is reused across HMR reloads.
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  // Production: cache at module level so the same connection pool is reused
  // across all requests handled by this worker process.
  if (!_prodClientPromise) {
    const client = new MongoClient(uri, options);
    _prodClientPromise = client.connect();
  }
  return _prodClientPromise;
}
