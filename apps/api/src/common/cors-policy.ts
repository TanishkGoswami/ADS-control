export function resolveCorsOrigins(env: NodeJS.ProcessEnv = process.env): (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void {
  const configured = [env.ADS_CONTROL_WEB_ORIGINS, env.ADS_CONTROL_EXTENSION_ORIGINS]
    .flatMap((value) => (value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow non-browser requests (e.g. server-to-server, curl)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = configured.includes(origin) || configured.includes('*');
    const isVercelDomain = /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/.test(origin);
    const isLocalhost = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);

    if (isExplicitlyAllowed || isVercelDomain || isLocalhost) {
      return callback(null, true);
    }

    // Default to allow in non-production or if configured
    if (env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(null, true); // Permissive CORS for seamless web and extension access
  };
}

