import * as React from 'react';
import type { z } from 'zod';

/**
 * Hook factorisant la plomberie des formulaires de drawer admin (create/edit).
 *
 * Apporte :
 *  - state local typé sur le schema Zod
 *  - reset automatique quand `open` passe à `true`
 *  - validation par schema (au submit), erreurs par champ accessibles via `errors`
 *  - flag `submitting` géré autour de l'`onSubmit` async
 *
 * Choix techniques :
 *  - On n'utilise pas `react-hook-form` (pas en deps) ni `@tanstack/react-form` (overkill ici).
 *  - La validation se fait au submit ; pas de validation "à la frappe" pour rester simple.
 */
export type UseDrawerFormOptions<TSchema extends z.ZodTypeAny> = {
    schema: TSchema;
    defaultValues: z.infer<TSchema>;
    open: boolean;
    onSubmit: (values: z.infer<TSchema>) => Promise<unknown> | unknown;
};

export type UseDrawerFormReturn<TValues extends Record<string, unknown>> = {
    values: TValues;
    errors: Partial<Record<keyof TValues, string>>;
    submitting: boolean;
    setField: <K extends keyof TValues>(key: K, value: TValues[K]) => void;
    submit: () => Promise<void>;
    reset: () => void;
};

export function useDrawerForm<TSchema extends z.ZodTypeAny>(
    opts: UseDrawerFormOptions<TSchema>
): UseDrawerFormReturn<z.infer<TSchema>> {
    type TValues = z.infer<TSchema>;
    const { schema, defaultValues, open, onSubmit } = opts;

    // Référence stable sur les defaults pour ne pas re-reset à chaque render.
    const defaultsRef = React.useRef(defaultValues);
    defaultsRef.current = defaultValues;

    const [values, setValues] = React.useState<TValues>(defaultValues);
    const [errors, setErrors] = React.useState<Partial<Record<keyof TValues, string>>>({});
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setValues(defaultsRef.current);
            setErrors({});
        }
    }, [open]);

    const setField = React.useCallback(<K extends keyof TValues>(key: K, value: TValues[K]) => {
        setValues(prev => ({ ...prev, [key]: value }));
        setErrors(prev => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const reset = React.useCallback(() => {
        setValues(defaultsRef.current);
        setErrors({});
    }, []);

    const submit = React.useCallback(async () => {
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
            const fieldErrors: Partial<Record<keyof TValues, string>> = {};
            for (const issue of parsed.error.issues) {
                const path = issue.path[0] as keyof TValues | undefined;
                if (path !== undefined && fieldErrors[path] === undefined) {
                    fieldErrors[path] = issue.message;
                }
            }
            setErrors(fieldErrors);
            return;
        }
        try {
            setSubmitting(true);
            await onSubmit(parsed.data);
        } finally {
            setSubmitting(false);
        }
    }, [schema, values, onSubmit]);

    return { values, errors, submitting, setField, submit, reset };
}
