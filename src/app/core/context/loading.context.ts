import { HttpContextToken } from '@angular/common/http';

/**
 * When set to `true` on an HTTP request, the global loading spinner
 * will NOT be shown. The component is expected to handle its own
 * loading state (e.g., skeleton screens).
 *
 * Default: false — all requests trigger the global spinner.
 */
export const IS_SILENT_LOAD = new HttpContextToken<boolean>(() => false);
