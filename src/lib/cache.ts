import { unstable_cache as nextCache } from "next/cache"; // Data memory
import { cache as reactCache } from "react"; // Request memory

// Define a generic callback type
type Callback<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;

// Updated cache function with proper typing
export function cache<TArgs extends unknown[], TResult>(
  cb: Callback<TArgs, TResult>,
  keyParts: string[],
  options: { revalidate?: number | false; tags?: string[] } = {}
) {
  return nextCache(reactCache(cb), keyParts as [string, ...string[]], options);
}
