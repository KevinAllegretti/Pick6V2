module.exports = {
  apps: [
    {
      name: 'Pick6V2',
      script: 'start.ts',
      interpreter: 'node',
      interpreter_args: '--require ts-node/register --max-old-space-size=2048',
      env: {
        NODE_ENV: 'development',
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY // Ensure this matches your .env key
      },
      cwd: '/home/bitnami/htdocs/Pick6V2'
    }
  ]
};
