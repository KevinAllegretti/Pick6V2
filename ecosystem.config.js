module.exports = {
    apps: [
      {
        name: 'Pick6V2',
        script: 'api/index.ts',
        interpreter: 'ts-node',
        env: {
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/'
        }
      }
    ]
  };
  