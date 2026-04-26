// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';

/**
 * Configuration i18n pour Révéla.
 *
 * Le projet est mono-locale (français) au démarrage. L'objectif de ce setup n'est pas
 * de servir plusieurs langues immédiatement, mais d'extraire les chaînes en clés pour
 * éviter de re-payer ce coût plus tard quand un client international apparaîtra.
 *
 * Pattern d'usage :
 *
 *   const { t } = useTranslation();
 *   <Button>{t('common.save')}</Button>
 *   toast.success(t('toast.companyCreated', { name: values.name }));
 *
 * Pour ajouter une nouvelle locale : créer `locales/<code>.json`, l'importer ici, et
 * l'ajouter dans `resources` ci-dessous. Le runtime n'a pas de detector — la langue
 * est explicitement `fr` jusqu'à arbitrage produit.
 */

const i18nInstance = i18n.createInstance();

void i18nInstance.use(initReactI18next).init({
    lng: 'fr',
    fallbackLng: 'fr',
    resources: {
        fr: { translation: fr },
    },
    interpolation: {
        escapeValue: false,
    },
    returnNull: false,
});

export const i18nReady = i18nInstance;

export default i18nInstance;
