import rateLimit from '../config/upstash.js';

const rateLimiter = async (req, res, next) => {
  try {
    const { success } = await rateLimit.limit("my-limit-key");
    // const { success } = await rateLimit.limit(user.id);

    if (!success) return res.status(429).json({ message: 'Too many requests. Please try again later.' });

    next();
  }
  catch (error) {
    console.error("rateLimiter error:", error);
    next(error);
  }

}

export default rateLimiter;
