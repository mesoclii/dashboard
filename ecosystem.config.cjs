module.exports = {
  apps: [
    {
      name: "possum-dashboard",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      watch: false,
      node_args: "--max-old-space-size=320 --max-semi-space-size=16",
      max_memory_restart: "380M",
      exp_backoff_restart_delay: 400,
      kill_timeout: 15000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
};
