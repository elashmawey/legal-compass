// Centralized CORS configuration
// In production, restrict to your actual domain(s)

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8081',
  'https://legal-compass.vercel.app',
  'https://legal-compass.lovable.app',
  // Add your production domains here
];

export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get('origin') || '';
  
  // In development, allow localhost
  const isDev = process.env.NODE_ENV === 'development';
  
  // Check if origin is allowed
  const isAllowed = isDev || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.lovable.app');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || '*' : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-ingest-token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function corsResponse(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request),
    },
  });
}
