import { defineConfig, type Connect } from 'vite';
import { requestExternalTelemetry } from './src/server/telemetrySources';

function installTelemetry(middlewares: Connect.Server) {
  middlewares.use('/.netlify/functions/telemetry', async (request, response) => {
    if ((request as { method?: string }).method !== 'GET') {
      response.statusCode = 405;
      response.setHeader('Allow', 'GET');
      response.end();
      return;
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(await requestExternalTelemetry()));
  });
}

export default defineConfig({
  base: './',
  plugins: [{
    name: 'outpost-telemetry',
    configureServer: server => { installTelemetry(server.middlewares); },
    configurePreviewServer: server => { installTelemetry(server.middlewares); },
  }],
});
