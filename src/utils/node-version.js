/**
 * Validates that the current Node.js runtime meets the minimum version
 * required for native ESM support (including stable top-level await).
 *
 * Minimum supported version: Node.js 18.0.0 (Active LTS)
 */

const MIN_MAJOR = 18;

/**
 * Parse the major version number from a Node.js version string.
 * @param {string} version - e.g. "v18.17.0"
 * @returns {number}
 */
function parseMajor(version) {
  return parseInt(version.replace(/^v/, "").split(".")[0], 10);
}

/**
 * Check that Node.js is new enough to support native ESM.
 * Exits the process with a helpful message if not.
 */
export function checkNodeVersion() {
  const major = parseMajor(process.version);
  if (major < MIN_MAJOR) {
    console.error(
      `suitup requires Node.js ${MIN_MAJOR} or later for native ESM support.\n` +
        `You are running Node.js ${process.version}.\n` +
        `Please upgrade: https://nodejs.org/en/download`
    );
    process.exit(1);
  }
}
