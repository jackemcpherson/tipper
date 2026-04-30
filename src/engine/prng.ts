/**
 * Seeded pseudo-random number generator.
 *
 * Mulberry32: a simple, fast 32-bit PRNG suitable for statistical
 * resampling. Not cryptographic — use only for bootstrap/shuffle.
 *
 * Uses only arithmetic operations (Web Standard compatible).
 */

/**
 * Create a seeded PRNG returning values in [0, 1).
 *
 * @param seed - Integer seed. Same seed → same sequence.
 * @returns A function that returns the next random value on each call.
 */
export function createPrng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
