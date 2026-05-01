import { describe, expect, test } from 'vitest';

describe('vitest infra sanity', () => {
    test('runtime + globals + jsdom OK', () => {
        expect(1 + 1).toBe(2);
        expect(typeof window).toBe('object');
        expect(typeof document).toBe('object');
    });
});
