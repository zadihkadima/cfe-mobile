/**
 * Renders a byte count the way a person would say it.
 *
 * A file listed as "4823718 bytes" tells the reader nothing they can act on;
 * whether it is worth downloading on a phone connection is the only question
 * the number needs to answer.
 */
const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes < 1000) {
    return `${bytes} B`;
  }

  let value = bytes;
  let unit = 0;

  // Decimal rather than binary units, because that is what the operating
  // system's own file listings show and disagreeing with them would make the
  // same file appear to be two different sizes.
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }

  // One decimal below ten, none above. "9.4 MB" is useful; "94.3 MB" is
  // spurious precision on a number nobody acts on that finely.
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`;
}
