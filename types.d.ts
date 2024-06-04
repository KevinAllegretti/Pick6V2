import session = require("express-session");

declare module 'express-session' {
    export interface SessionData {
      username?: string; // Add other custom session properties here if needed
      isAuth?: boolean;
    }
  }

  declare namespace NodeJS {
    interface Global {
      _mongoClientPromise: Promise<import('mongodb').MongoClient>;
    }
  }
  
declare module 'express';
declare module 'body-parser';
