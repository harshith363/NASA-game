import { requestExternalTelemetry } from '../../src/server/telemetrySources';

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  const readings = await requestExternalTelemetry();
  return Response.json(readings, { headers: { 'Cache-Control': 'public, max-age=30' } });
};
