// test-runner.js - Simple test runner for keyboard layout logic

let testsPassed = 0;
let testsFailed = 0;
let currentSuite = '';

export function suite(name, fn) {
  currentSuite = name;
  console.log(`\n${name}`);
  fn();
  currentSuite = '';
}

export function test(description, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`  ✓ ${description}`);
  } catch (error) {
    testsFailed++;
    console.log(`  ✗ ${description}`);
    console.log(`    ${error.message}`);
  }
}

export function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
    );
  }
}

export function assertDeepEquals(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);

  if (actualStr !== expectedStr) {
    throw new Error(
      message || `\nExpected: ${expectedStr}\nActual:   ${actualStr}`
    );
  }
}

export function printSummary() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    console.log('\n❌ SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED');
  }
}
