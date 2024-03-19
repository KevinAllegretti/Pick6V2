declare module 'express-session' {
    interface SessionData {
      username?: string; // Add other custom session properties here if needed
      isAuth?: boolean;
    }
  }

declare module 'express';
declare module 'body-parser';
