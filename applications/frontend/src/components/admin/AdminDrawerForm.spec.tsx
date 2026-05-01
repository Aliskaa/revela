import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { renderWithTheme } from '@/test/render';

import { AdminDrawerForm } from './AdminDrawerForm';

describe('<AdminDrawerForm />', () => {
    test('ne rend pas son contenu quand open=false', () => {
        renderWithTheme(
            <AdminDrawerForm open={false} title="Hidden" onClose={() => {}}>
                <p>Contenu invisible</p>
            </AdminDrawerForm>
        );
        expect(screen.queryByText('Contenu invisible')).not.toBeInTheDocument();
    });

    test('rend titre, sous-titre et contenu quand open=true', () => {
        renderWithTheme(
            <AdminDrawerForm open title="Nouvelle entreprise" subtitle="Créer une entreprise" onClose={() => {}}>
                <p>Champs ici</p>
            </AdminDrawerForm>
        );
        expect(screen.getByText('Nouvelle entreprise')).toBeInTheDocument();
        expect(screen.getByText('Créer une entreprise')).toBeInTheDocument();
        expect(screen.getByText('Champs ici')).toBeInTheDocument();
    });

    test('appelle onClose au clic sur le bouton de fermeture', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderWithTheme(
            <AdminDrawerForm open title="Drawer" onClose={onClose}>
                <p>x</p>
            </AdminDrawerForm>
        );
        await user.click(screen.getByLabelText('Fermer le panneau'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('appelle onClose au clic sur Annuler', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderWithTheme(
            <AdminDrawerForm open title="Drawer" onClose={onClose}>
                <p>x</p>
            </AdminDrawerForm>
        );
        await user.click(screen.getByRole('button', { name: 'Annuler' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('appelle onSubmit au clic sur Enregistrer', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        renderWithTheme(
            <AdminDrawerForm open title="Drawer" onClose={() => {}} onSubmit={onSubmit}>
                <p>x</p>
            </AdminDrawerForm>
        );
        await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('désactive le bouton Enregistrer quand isSubmitDisabled=true', () => {
        renderWithTheme(
            <AdminDrawerForm open title="Drawer" onClose={() => {}} onSubmit={() => {}} isSubmitDisabled>
                <p>x</p>
            </AdminDrawerForm>
        );
        expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    });

    test('affiche "Enregistrement…" et désactive le bouton quand isSubmitting=true', () => {
        renderWithTheme(
            <AdminDrawerForm open title="Drawer" onClose={() => {}} onSubmit={() => {}} isSubmitting>
                <p>x</p>
            </AdminDrawerForm>
        );
        const button = screen.getByRole('button', { name: 'Enregistrement…' });
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
    });

    test("omet le bouton submit quand onSubmit n'est pas fourni", () => {
        renderWithTheme(
            <AdminDrawerForm open title="Drawer" onClose={() => {}}>
                <p>x</p>
            </AdminDrawerForm>
        );
        expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
    });

    test('utilise les libellés personnalisés submitLabel / cancelLabel', () => {
        renderWithTheme(
            <AdminDrawerForm
                open
                title="Drawer"
                onClose={() => {}}
                onSubmit={() => {}}
                submitLabel="Créer"
                cancelLabel="Fermer"
            >
                <p>x</p>
            </AdminDrawerForm>
        );
        expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    });
});
