// Dev server wrapper — starts Vite dev server on port 3000
import { createServer } from 'vite';

const server = await createServer({
  server: { port: 3000, host: true },
  configFile: './vite.config.ts',
});

await server.listen();
server.printUrls();
