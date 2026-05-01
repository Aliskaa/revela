// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderWithTheme } from '@/test/render';

import { ToastProvider, useToast } from './toast';

function ErrorTrigger() {
    const toast = useToast();
    return (
        <button type="button" onClick={() => toast.error('Échec — réessayez')}>
            trigger
        </button>
    );
}

function SuccessTrigger() {
    const toast = useToast();
    return (
        <button type="button" onClick={() => toast.success('Bien reçu')}>
            trigger
        </button>
    );
}

describe('ToastProvider — a11y', () => {
    it('error toast has role="alert" + aria-live="assertive"', () => {
        const { getByRole, container } = renderWithTheme(
            <ToastProvider>
                <ErrorTrigger />
            </ToastProvider>
        );
        act(() => {
            (container.querySelector('button') as HTMLButtonElement).click();
        });
        const alert = getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'assertive');
        expect(alert).toHaveTextContent('Échec — réessayez');
    });

    it('success toast has role="status" + aria-live="polite"', () => {
        const { getByRole, container } = renderWithTheme(
            <ToastProvider>
                <SuccessTrigger />
            </ToastProvider>
        );
        act(() => {
            (container.querySelector('button') as HTMLButtonElement).click();
        });
        const status = getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
        expect(status).toHaveTextContent('Bien reçu');
    });

    it('rendered toast has no axe-core a11y violations', async () => {
        const { container } = renderWithTheme(
            <ToastProvider>
                <SuccessTrigger />
            </ToastProvider>
        );
        act(() => {
            (container.querySelector('button') as HTMLButtonElement).click();
        });
        const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
        expect(results).toHaveNoViolations();
    });
});
