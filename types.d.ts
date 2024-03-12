declare module 'express-session' {
    export interface SessionData {
      username?: string; // Add other custom session properties here if needed
    }
  }

declare module 'express';
declare module 'body-parser';
