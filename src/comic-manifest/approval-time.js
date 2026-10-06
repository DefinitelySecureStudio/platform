const maxTimestampLength = 32;
const timestampPattern = /^(\d{4})-(\d{2})-(\d{2})(?:[Tt]|\s)(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/;

function parts(value) {
  if (typeof value !== 'string' || value.length > maxTimestampLength) return null;
  const match = timestampPattern.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = ''] = match;
  if (fraction.length > 11) return null;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > days[month - 1]) return null;
  return { whole: `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}`, fraction };
}

/** Compare candidate-schema UTC timestamps exactly; null means invalid for approval use. */
export function compareComicApprovalTimes(left, right) {
  const a = parts(left), b = parts(right);
  if (!a || !b) return null;
  if (a.whole < b.whole) return -1;
  if (a.whole > b.whole) return 1;
  const af = a.fraction.padEnd(11, '0'), bf = b.fraction.padEnd(11, '0');
  return af < bf ? -1 : af > bf ? 1 : 0;
}

export function isComicApprovalTime(value) {
  return compareComicApprovalTimes(value, value) === 0;
}
