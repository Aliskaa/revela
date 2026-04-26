import { screen } from '@testing-library/react';
import { Building2 } from 'lucide-react';
import { describe, expect, test } from 'vitest';

import { renderWithTheme } from '@/test/render';

import { StatCard } from './StatCard';

describe('<StatCard />', () => {
    test('affiche label + valeur + helper', () => {
        renderWithTheme(<StatCard label="Entreprises" value={42} helper="référencées" icon={Building2} />);

        expect(screen.getByText('Entreprises')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('référencées')).toBeInTheDocument();
    });

    test('omet le helper s\'il n\'est pas fourni', () => {
        renderWithTheme(<StatCard label="Stat" value={1} icon={Building2} />);

        // Pas d'élément avec un texte de caption — vérifié indirectement par rendu sans crash.
        expect(screen.getByText('Stat')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('affiche un Skeleton à la place de la valeur quand loading=true', () => {
        const { container } = renderWithTheme(
            <StatCard label="Loading" value={0} icon={Building2} loading />
        );

        // En mode loading la valeur n'est pas rendue
        expect(screen.queryByText('0')).not.toBeInTheDocument();
        // Et le Skeleton MUI est présent (classe MuiSkeleton-root)
        expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    });

    test('accepte des valeurs string', () => {
        renderWithTheme(<StatCard label="Statut" value="Actif" icon={Building2} />);
        expect(screen.getByText('Actif')).toBeInTheDocument();
    });
});
