// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderWithTheme } from '@/test/render';

import { AdminDrawerForm } from './AdminDrawerForm';

describe('AdminDrawerForm — a11y', () => {
    it('open drawer has no axe-core a11y violations', async () => {
        const { baseElement } = renderWithTheme(
            <AdminDrawerForm
                open
                title="Nouvelle entreprise"
                subtitle="Créer une entreprise et la relier à ses campagnes."
                onClose={() => {}}
                onSubmit={() => {}}
                submitLabel="Créer"
            >
                <input aria-label="Nom de l'entreprise" />
            </AdminDrawerForm>
        );
        const results = await axe(baseElement, { rules: { 'color-contrast': { enabled: false } } });
        expect(results).toHaveNoViolations();
    });
});
