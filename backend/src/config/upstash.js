import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis'
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
}

// create a rate limiter that allows 100 requests / 60 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '60 s'),
})


export default ratelimit;
