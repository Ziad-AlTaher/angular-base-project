import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';

/** Maximum number of retry attempts before giving up. */
const MAX_RETRIES = 5;

/** Base delay in milliseconds for the first retry. */
const BASE_DELAY_MS = 1000;

/**
 * Determines whether a failed request should be retried.
 *
 * Retry only on:
 *  - status === 0  → network-level failures (offline, CORS, ERR_INTERNET_DISCONNECTED)
 *  - status >= 500 → server-side errors (502 Bad Gateway, 503 Unavailable, etc.)
 *
 * Client errors (4xx) are intentional responses and should NOT be retried.
 */
function shouldRetry(error: HttpErrorResponse): boolean {
    return error.status === 0 || error.status >= 500;
}

/**
 * Calculates the exponential backoff delay for a given retry attempt.
 *
 * Formula: 2^(retryCount - 1) × BASE_DELAY_MS
 *
 *  Attempt 1 → 2^0 × 1000 =  1 000 ms
 *  Attempt 2 → 2^1 × 1000 =  2 000 ms
 *  Attempt 3 → 2^2 × 1000 =  4 000 ms
 *  Attempt 4 → 2^3 × 1000 =  8 000 ms
 *  Attempt 5 → 2^4 × 1000 = 16 000 ms
 */
function backoffDelay(retryCount: number): number {
    return Math.pow(2, retryCount - 1) * BASE_DELAY_MS;
}

/**
 * Functional HTTP interceptor that retries failed requests with exponential backoff.
 *
 * How the delay factory works with RxJS retry:
 *  - Return an Observable that EMITS  → "retry now" (resubscribe to source)
 *  - Return an Observable that ERRORS → "give up"  (propagate the error downstream)
 *
 * So we return timer(delay) directly — when it emits after the delay, retry
 * resubscribes to next(req), issuing a fresh HTTP request.
 */
export const networkRetryInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
) => {
    return next(req).pipe(
        retry({
            count: MAX_RETRIES,
            delay: (error: HttpErrorResponse, retryCount: number) => {
                // Bail out immediately for client errors (4xx) — no point retrying.
                if (!shouldRetry(error)) {
                    return throwError(() => error);
                }

                const delayMs = backoffDelay(retryCount);
                console.warn(
                    `[NetworkRetry] Attempt ${retryCount}/${MAX_RETRIES} — ` +
                    `status: ${error.status}, retrying in ${delayMs}ms…`
                );

                // ✅ Return timer() directly.
                // When timer emits, retry resubscribes to the source (new HTTP request).
                // ❌ Do NOT pipe throwError after the timer — that would make the delay
                //    observable error, signalling "give up" and stopping all retries.
                return timer(delayMs);
            }
        })
    );
};
