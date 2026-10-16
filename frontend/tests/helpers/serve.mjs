import { build, preview } from 'vite';

// Exercise the production build, including its same-origin API configuration.
process.env.VITE_API_URL = '';
await build();
const server = await preview({
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.httpServer.close(() => process.exit(0)));
}
