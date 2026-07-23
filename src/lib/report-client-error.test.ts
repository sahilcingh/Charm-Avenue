import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportClientError } from './report-client-error';

describe('reportClientError', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetchMock);
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        consoleErrorSpy.mockRestore();
    });

    it('always logs to the console so the error is visible in local/dev tools', () => {
        reportClientError(new Error('boom'));
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('posts the error message, stack, and context to /api/log-error', () => {
        reportClientError(new Error('boom'), { componentStack: 'in <Header>' });

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/log-error',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('boom'),
            })
        );
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.message).toBe('boom');
        expect(body.context).toEqual({ componentStack: 'in <Header>' });
    });

    it('handles a non-Error value being thrown (e.g. a thrown string) without crashing (edge case)', () => {
        expect(() => reportClientError('a plain string was thrown')).not.toThrow();
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.message).toBe('a plain string was thrown');
    });

    it('never lets a failed report call itself throw (failure case: reporting must not break the app further)', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));
        expect(() => reportClientError(new Error('boom'))).not.toThrow();
        // let the rejected promise's .catch() run before the test ends
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
});
