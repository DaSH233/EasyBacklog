import { afterEach, describe, expect, it } from "bun:test";
import { ApiClient, NetworkError } from "../web/lib/api.ts";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("Web API request deadlines", () => {
	it("clears a failed attempt's deadline before retrying a network error", async () => {
		const signals: AbortSignal[] = [];
		globalThis.fetch = Object.assign(
			async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
				signals.push(init?.signal as AbortSignal);
				if (signals.length === 1) throw new TypeError("Connection reset");
				return Response.json([]);
			},
			{ preconnect: originalFetch.preconnect },
		);
		expect(await new ApiClient({ retries: 1, timeout: 50 }).search()).toEqual([]);
		expect(signals).toHaveLength(2);
		// The retry backoff exceeds the deadline, but finished attempts must not fire it.
		expect(signals.every((signal) => !signal.aborted)).toBe(true);
	});

	it("still aborts a request that exceeds its configured deadline", async () => {
		globalThis.fetch = Object.assign(
			(_input: Parameters<typeof fetch>[0], init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), {
						once: true,
					});
				}),
			{ preconnect: originalFetch.preconnect },
		);
		await expect(new ApiClient({ retries: 0, timeout: 20 }).search()).rejects.toBeInstanceOf(NetworkError);
	});
});
