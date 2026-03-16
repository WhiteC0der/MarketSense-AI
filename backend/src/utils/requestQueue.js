/**
 * Request Queue for throttling API calls
 * Ensures requests are processed with delays to avoid rate limiting
 */
class RequestQueue {
  constructor(delayMs = 500) {
    this.queue = [];
    this.processing = false;
    this.delayMs = delayMs;
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

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const { requestFn, resolve, reject } = this.queue.shift();

      try {
        const result = await requestFn();
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
