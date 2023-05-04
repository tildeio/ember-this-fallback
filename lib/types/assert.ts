export default function assert(
  message: string,
  condition?: unknown
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
