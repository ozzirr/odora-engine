/**
 * Unique identifier for the current deployment.
 * On Vercel this is set automatically per-deploy.
 * Including it in unstable_cache keys ensures each deployment
 * starts with a fresh Data Cache — stale empty results from
 * a previous deploy can never bleed into a new one.
 */
export const DEPLOY_ID =
  process.env.VERCEL_DEPLOYMENT_ID ??
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ??
  "local";
