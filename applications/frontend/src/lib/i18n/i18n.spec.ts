// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { describe, expect, it } from 'vitest';

import i18n from './index';

describe('i18n', () => {
    it('initializes with French as the active language', () => {
        expect(i18n.language).toBe('fr');
    });

    it('resolves common keys', () => {
        expect(i18n.t('common.save')).toBe('Enregistrer');
        expect(i18n.t('common.cancel')).toBe('Annuler');
        expect(i18n.t('common.saving')).toBe('Enregistrement…');
    });

    it('interpolates variables in a key', () => {
        expect(i18n.t('toast.companyCreated', { name: 'Ville de Lyon' })).toBe(
            'Entreprise « Ville de Lyon » créée.'
        );
    });

    it('returns the key path when the key is missing (fallback safety)', () => {
        expect(i18n.t('does.not.exist')).toBe('does.not.exist');
    });
});
