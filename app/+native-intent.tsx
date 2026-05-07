export function redirectSystemPath({
  _path,
  _initial,
}: { _path: string; _initial: boolean }) {
  console.log('[NativeIntent] Redirecting path:', _path, 'initial:', _initial);
  return '/';
}
