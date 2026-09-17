/**
 * Scenario verification for guest free-search limit math.
 * Mirrors hooks/useSearchLimit.ts + SearchLimitBanner messaging.
 */
const FREE_SEARCH_LIMIT = 3;

function remaining(count) {
  return Math.max(0, FREE_SEARCH_LIMIT - count);
}

function hasReachedLimit(count, isLoggedIn) {
  if (isLoggedIn) return false;
  return count >= FREE_SEARCH_LIMIT;
}

function bannerMessage(count, isLoggedIn) {
  if (isLoggedIn) return null;
  const left = remaining(count);
  if (left === 0) return { text: "Sign in for unlimited", tone: "red" };
  if (left === 1) return { text: "1 free search remaining", tone: "amber" };
  return { text: `${left} free searches remaining`, tone: "neutral" };
}

function simulateGuestFlow() {
  const steps = [];
  let count = 0;

  steps.push({
    event: "visit",
    count,
    banner: bannerMessage(count, false),
    blocked: hasReachedLimit(count, false),
  });

  for (let i = 1; i <= 4; i++) {
    if (hasReachedLimit(count, false)) {
      steps.push({
        event: `attempt_message_${i}`,
        count,
        blocked: true,
        modal: true,
        banner: bannerMessage(count, false),
      });
      break;
    }
    count += 1;
    steps.push({
      event: `send_message_${i}`,
      count,
      blocked: false,
      modal: false,
      banner: bannerMessage(count, false),
    });
  }

  // After login
  const loggedIn = true;
  count = 0;
  steps.push({
    event: "after_login",
    count,
    banner: bannerMessage(count, loggedIn),
    blocked: hasReachedLimit(count, loggedIn),
    unlimited: !hasReachedLimit(count, loggedIn),
  });

  return steps;
}

const steps = simulateGuestFlow();
const expected = [
  { event: "visit", count: 0, bannerText: "3 free searches remaining", tone: "neutral", blocked: false },
  { event: "send_message_1", count: 1, bannerText: "2 free searches remaining", tone: "neutral", blocked: false },
  { event: "send_message_2", count: 2, bannerText: "1 free search remaining", tone: "amber", blocked: false },
  { event: "send_message_3", count: 3, bannerText: "Sign in for unlimited", tone: "red", blocked: false },
  { event: "attempt_message_4", count: 3, modal: true, blocked: true, bannerText: "Sign in for unlimited", tone: "red" },
  { event: "after_login", count: 0, banner: null, unlimited: true, blocked: false },
];

let failed = 0;
for (let i = 0; i < expected.length; i++) {
  const got = steps[i];
  const exp = expected[i];
  const checks = [];

  if (got.event !== exp.event) checks.push(`event ${got.event} != ${exp.event}`);
  if (got.count !== exp.count) checks.push(`count ${got.count} != ${exp.count}`);
  if (exp.blocked !== undefined && got.blocked !== exp.blocked) checks.push(`blocked mismatch`);
  if (exp.modal && !got.modal) checks.push("expected modal");
  if (exp.bannerText) {
    if (!got.banner || got.banner.text !== exp.bannerText) checks.push(`banner text ${got.banner?.text}`);
    if (!got.banner || got.banner.tone !== exp.tone) checks.push(`tone ${got.banner?.tone}`);
  }
  if (exp.banner === null && got.banner !== null) checks.push("banner should hide");
  if (exp.unlimited && !got.unlimited) checks.push("expected unlimited");

  if (checks.length) {
    failed += 1;
    console.error("FAIL", exp.event, checks, { got });
  } else {
    console.log("PASS", exp.event, got.banner?.text ?? "(hidden)", got.modal ? "+modal" : "");
  }
}

if (failed) {
  console.error(`\n${failed} scenario step(s) failed`);
  process.exit(1);
}
console.log("\nAll scenario steps passed.");
