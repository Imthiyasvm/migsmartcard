/**
 * Simple test for URL normalization functions.
 * These are the same functions used in the app.
 * Run: node scripts/test-url-utils.mjs
 */

// ── Replicate the functions from src/lib/utils.ts ──

function normalizeWebsiteUrl(url) {
  if (!url || typeof url !== "string") return "";
  let normalized = url.trim();
  if (!normalized) return "";
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

function displayWebsiteUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

function isValidUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const normalized = normalizeWebsiteUrl(url);
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}

// ── Test runner ──

let passed = 0;
let failed = 0;

function test(name, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

console.log("\n=== normalizeWebsiteUrl ===\n");

test("adds https:// to bare domain", normalizeWebsiteUrl("example.com"), "https://example.com");
test("adds https:// to www domain", normalizeWebsiteUrl("www.example.com"), "https://www.example.com");
test("adds https:// to subdomain", normalizeWebsiteUrl("sub.example.com"), "https://sub.example.com");
test("preserves http://", normalizeWebsiteUrl("http://example.com"), "http://example.com");
test("preserves https://", normalizeWebsiteUrl("https://example.com"), "https://example.com");
test("removes trailing slash", normalizeWebsiteUrl("https://example.com/"), "https://example.com");
test("removes multiple trailing slashes", normalizeWebsiteUrl("https://example.com///"), "https://example.com");
test("trims whitespace", normalizeWebsiteUrl("  example.com  "), "https://example.com");
test("handles empty string", normalizeWebsiteUrl(""), "");
test("handles null", normalizeWebsiteUrl(null), "");
test("handles undefined", normalizeWebsiteUrl(undefined), "");
test("handles URL with path", normalizeWebsiteUrl("example.com/path"), "https://example.com/path");
test("removes trailing slash from path", normalizeWebsiteUrl("https://example.com/path/"), "https://example.com/path");

console.log("\n=== displayWebsiteUrl ===\n");

test("removes https://", displayWebsiteUrl("https://example.com"), "example.com");
test("removes http://", displayWebsiteUrl("http://example.com"), "example.com");
test("removes www", displayWebsiteUrl("https://www.example.com"), "example.com");
test("removes trailing slash", displayWebsiteUrl("https://example.com/"), "example.com");
test("keeps path", displayWebsiteUrl("https://example.com/path"), "example.com/path");
test("handles empty", displayWebsiteUrl(""), "");
test("handles null", displayWebsiteUrl(null), "");
test("handles undefined", displayWebsiteUrl(undefined), "");
test("handles bare domain", displayWebsiteUrl("example.com"), "example.com");
test("removes www from bare domain", displayWebsiteUrl("www.example.com"), "example.com");

console.log("\n=== isValidUrl ===\n");

test("validates https URL", isValidUrl("https://example.com"), true);
test("validates http URL", isValidUrl("http://example.com"), true);
test("validates URL with path", isValidUrl("https://example.com/path"), true);
test("validates bare domain", isValidUrl("example.com"), true);
test("validates www domain", isValidUrl("www.example.com"), true);
test("rejects invalid URL", isValidUrl("not a url"), false);
test("rejects empty string", isValidUrl(""), false);
test("rejects null", isValidUrl(null), false);
test("rejects undefined", isValidUrl(undefined), false);

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(50)}\n`);

if (failed > 0) process.exit(1);
