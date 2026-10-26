// Minimal runtime globals available in browsers, React Native and Node.
// Only the shared tsconfig includes this file, so apps keep their own platform typings.
declare function setTimeout(callback: () => void, ms?: number): unknown;
declare function clearTimeout(handle: unknown): void;
declare const console: { error(...data: unknown[]): void; warn(...data: unknown[]): void };
