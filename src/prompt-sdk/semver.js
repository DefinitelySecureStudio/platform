const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/u;

export function parseSemver(value) {
  if (typeof value !== "string") return undefined;
  const match = SEMVER.exec(value);
  if (!match) return undefined;
  return {
    raw: value,
    major: BigInt(match[1]), minor: BigInt(match[2]), patch: BigInt(match[3]),
    prerelease: match[4]?.split(".") ?? [], build: match[5]?.split(".") ?? []
  };
}

function compareIdentifiers(left, right) {
  const leftNumeric = /^[0-9]+$/u.test(left);
  const rightNumeric = /^[0-9]+$/u.test(right);
  if (leftNumeric && rightNumeric) {
    const a = BigInt(left);
    const b = BigInt(right);
    return a < b ? -1 : a > b ? 1 : 0;
  }
  if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
  return left < right ? -1 : left > right ? 1 : 0;
}

export function compareSemver(left, right) {
  const a = typeof left === "string" ? parseSemver(left) : left;
  const b = typeof right === "string" ? parseSemver(right) : right;
  if (!a || !b) throw new TypeError("compareSemver requires valid full Semantic Versions.");
  for (const key of ["major", "minor", "patch"]) if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  if (a.prerelease.length === 0 || b.prerelease.length === 0) return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length ? -1 : 1;
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    if (a.prerelease[index] === undefined || b.prerelease[index] === undefined) return a.prerelease[index] === undefined ? -1 : 1;
    const comparison = compareIdentifiers(a.prerelease[index], b.prerelease[index]);
    if (comparison !== 0) return comparison;
  }
  return 0;
}

function comparator(operator, version) {
  return { operator, version, parsed: parseSemver(version) };
}

export function parseSemverRange(range) {
  if (typeof range !== "string" || range.trim() !== range || range.length === 0) return undefined;
  if (range.startsWith("^") || range.startsWith("~")) {
    const lower = parseSemver(range.slice(1));
    if (!lower) return undefined;
    const upper = range[0] === "~"
      ? `${lower.major}.${lower.minor + 1n}.0`
      : lower.major > 0n ? `${lower.major + 1n}.0.0` : lower.minor > 0n ? `0.${lower.minor + 1n}.0` : `0.0.${lower.patch + 1n}`;
    return [comparator(">=", lower.raw), comparator("<", upper)];
  }
  const tokens = range.split(/ +/u);
  const comparators = tokens.map((token) => {
    const match = /^(>=|<=|>|<|=)?(.+)$/u.exec(token);
    return match ? comparator(match[1] ?? "=", match[2]) : undefined;
  });
  if (comparators.some((item) => !item?.parsed)) return undefined;
  return comparators;
}

export function satisfiesSemverRange(version, range) {
  const candidate = typeof version === "string" ? parseSemver(version) : version;
  const comparators = typeof range === "string" ? parseSemverRange(range) : range;
  if (!candidate || !comparators?.length) return false;
  if (candidate.prerelease.length && !comparators.some(({ parsed }) => parsed.prerelease.length && parsed.major === candidate.major && parsed.minor === candidate.minor && parsed.patch === candidate.patch)) return false;
  return comparators.every(({ operator, parsed }) => {
    const comparison = compareSemver(candidate, parsed);
    return operator === ">" ? comparison > 0 : operator === ">=" ? comparison >= 0 : operator === "<" ? comparison < 0 : operator === "<=" ? comparison <= 0 : comparison === 0;
  });
}
