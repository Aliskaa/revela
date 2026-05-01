import { Alert, type AlertColor, Snackbar } from '@mui/material';
import * as React from 'react';

/**
 * Système de notification global (toast) basé sur MUI Snackbar/Alert.
 *
 * Pattern : un `ToastProvider` à la racine expose un context lu par `useToast()`. Les toasts
 * sont affichés un à la fois (le suivant remplace le précédent à l'instant t pour rester
 * lisible). Si on a besoin d'empilement plus tard, basculer sur `notistack`.
 */

export type ToastSeverity = AlertColor;

export type ToastOptions = {
    severity?: ToastSeverity;
    /** Durée d'affichage en ms ; `null` pour ne jamais auto-fermer. Défaut : 5000 (3000 pour success). */
    autoHideDurationMs?: number | null;
};

type ToastState = {
    id: number;
    message: string;
    severity: ToastSeverity;
    autoHideDurationMs: number | null;
};

type ToastContextValue = {
    notify: (message: string, options?: ToastOptions) => void;
    success: (message: string, options?: Omit<ToastOptions, 'severity'>) => void;
    error: (message: string, options?: Omit<ToastOptions, 'severity'>) => void;
    info: (message: string, options?: Omit<ToastOptions, 'severity'>) => void;
    warning: (message: string, options?: Omit<ToastOptions, 'severity'>) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_BY_SEVERITY: Record<ToastSeverity, number | null> = {
    success: 3000,
    info: 4000,
    warning: 5000,
    error: 6000,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [current, setCurrent] = React.useState<ToastState | null>(null);
    const idRef = React.useRef(0);

    const notify = React.useCallback((message: string, options?: ToastOptions) => {
        const severity = options?.severity ?? 'info';
        const autoHide =
            options?.autoHideDurationMs === undefined
                ? DEFAULT_DURATION_BY_SEVERITY[severity]
                : options.autoHideDurationMs;
        idRef.current += 1;
        setCurrent({ id: idRef.current, message, severity, autoHideDurationMs: autoHide });
    }, []);

    const value = React.useMemo<ToastContextValue>(
        () => ({
            notify,
            success: (m, o) => notify(m, { ...o, severity: 'success' }),
            error: (m, o) => notify(m, { ...o, severity: 'error' }),
            info: (m, o) => notify(m, { ...o, severity: 'info' }),
            warning: (m, o) => notify(m, { ...o, severity: 'warning' }),
        }),
        [notify]
    );

    const handleClose = React.useCallback((_event: unknown, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setCurrent(null);
    }, []);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Snackbar
                key={current?.id ?? 'empty'}
                open={current !== null}
                onClose={handleClose}
                autoHideDuration={current?.autoHideDurationMs ?? null}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                {current ? (
                    <Alert
                        elevation={6}
                        variant="filled"
                        severity={current.severity}
                        onClose={() => setCurrent(null)}
                        sx={{ width: '100%' }}
                        role={current.severity === 'error' || current.severity === 'warning' ? 'alert' : 'status'}
                        aria-live={
                            current.severity === 'error' || current.severity === 'warning' ? 'assertive' : 'polite'
                        }
                    >
                        {current.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </ToastContext.Provider>
    );
}

/**
 * Hook qui retourne les helpers de notification. À appeler depuis n'importe quel composant
 * descendant de `<ToastProvider>` (typiquement, n'importe où sous `__root.tsx`).
 *
 * Lève si appelé hors `ToastProvider` — un toast oublié vaut mieux qu'une erreur silencieuse.
 */
export function useToast(): ToastContextValue {
    const ctx = React.useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast() doit être appelé à l’intérieur d’un <ToastProvider>.');
    }
    return ctx;
}
