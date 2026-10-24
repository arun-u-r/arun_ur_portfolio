import { createHash } from "node:crypto";

const WINDOW_MILLISECONDS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const incrementScript = [
  "local count = redis.call('INCR', KEYS[1])",
  "if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
  "return {count, redis.call('PTTL', KEYS[1])}",
].join("\n");

export class RateLimitConfigurationError extends Error {}

export class RateLimitServiceError extends Error {}

function getClientAddress(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const addresses = forwardedFor.split(",");
    return addresses[addresses.length - 1]?.trim() || "unknown";
  }

  return "unknown";
}

export async function checkContactRateLimit(request: Request) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    throw new RateLimitConfigurationError(
      "A durable Upstash Redis rate-limit store is not configured.",
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(redisUrl);
  } catch {
    throw new RateLimitConfigurationError(
      "The Upstash Redis REST URL is invalid.",
    );
  }

  if (endpoint.protocol !== "https:") {
    throw new RateLimitConfigurationError(
      "The Upstash Redis REST URL must use HTTPS.",
    );
  }

  const now = Date.now();
  const window = Math.floor(now / WINDOW_MILLISECONDS);
  const addressHash = createHash("sha256")
    .update(getClientAddress(request))
    .digest("hex");
  const key = `portfolio-contact:${addressHash}:${window}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        incrementScript,
        "1",
        key,
        String(WINDOW_MILLISECONDS),
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    throw new RateLimitServiceError(
      "The durable rate-limit service could not be reached.",
    );
  }

  if (!response.ok) {
    throw new RateLimitServiceError(
      `The durable rate-limit service returned ${response.status}.`,
    );
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new RateLimitServiceError(
      "The durable rate-limit service returned an invalid response.",
    );
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("result" in result) ||
    !Array.isArray(result.result) ||
    typeof result.result[0] !== "number" ||
    typeof result.result[1] !== "number"
  ) {
    throw new RateLimitServiceError(
      "The durable rate-limit service returned an invalid result.",
    );
  }

  const [count, ttl] = result.result;
  return {
    limited: count > MAX_REQUESTS_PER_WINDOW,
    retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)),
  };
}
