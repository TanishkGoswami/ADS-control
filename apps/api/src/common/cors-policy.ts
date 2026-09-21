export function resolveCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const values = [env.ADS_CONTROL_WEB_ORIGINS, env.ADS_CONTROL_EXTENSION_ORIGINS]
    .flatMap((value) => (value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.includes('*')) throw new Error('Wildcard CORS origins are not allowed');
  if (env.NODE_ENV === 'production' && values.length === 0) throw new Error('ADS_CONTROL_WEB_ORIGINS or ADS_CONTROL_EXTENSION_ORIGINS is required in production');
  return values.length > 0 ? [...new Set(values)] : ['http://localhost:5173', 'http://127.0.0.1:5173'];
}
