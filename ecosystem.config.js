module.exports = {
    apps: [
      {
        name: 'Pick6V2',
        script: 'api/index.ts',
        interpreter: 'ts-node',
        env: {
          NODE_ENV: 'development',
          SENDGRID_API_KEY: process.env.SENDGRID_API_KEY // Ensure this matches your .env key
        },
        cwd: '/home/bitnami/htdocs/Pick6V2'
      }
    ]
  };
  