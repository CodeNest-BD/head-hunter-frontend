import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Rewrites a page reached by UUID (an old link, an old notification) to the
 * entity's serial URL once it has loaded. `replace`, so Back doesn't bounce
 * through the old URL. `canonicalPath` must come from the same builder the
 * app links with, or the two would bounce the reader between forms.
 */
export function useCanonicalPath(canonicalPath: string | undefined): void {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (canonicalPath && pathname !== canonicalPath) {
      router.replace(canonicalPath);
    }
  }, [canonicalPath, pathname, router]);
}
