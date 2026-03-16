/**
 * Request Queue for throttling API calls
 * Ensures requests are processed with delays to avoid rate limiting,
 * with exponential backoff retries for 429 rate-limit errors.
 */
class RequestQueue {
  constructor(delayMs = 500, maxRetries = 3) {
    this.queue = [];
    this.processing = false;
    this.delayMs = delayMs;
    this.maxRetries = maxRetries;
  }

  /**
   * Add a request to the queue
   * @param {Function} requestFn - Async function to execute
   * @returns {Promise} - Resolves with the result of requestFn
   */
  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.process();
    });
  }

  isRateLimitError(error) {
    return (
      error?.message?.includes('429') ||
      error?.message?.includes('Too Many Requests') ||
      error?.status === 429 ||
      error?.statusCode === 429
    );
  }

  async executeWithRetry(requestFn) {
    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (this.isRateLimitError(error)) {
          // Exponential backoff: 2s, 4s, 8s (capped at 30s)
          const backoffMs = Math.min(2000 * Math.pow(2, attempt), 30000);
          console.warn(`Rate limit hit (attempt ${attempt + 1}/${this.maxRetries}). Retrying in ${backoffMs}ms...`);
          await this.sleep(backoffMs);
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const { requestFn, resolve, reject } = this.queue.shift();

      try {
        const result = await this.executeWithRetry(requestFn);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Add delay between requests to avoid rate limiting
      if (this.queue.length > 0) {
        await this.sleep(this.delayMs);
      }
    }

    this.processing = false;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default RequestQueue;
