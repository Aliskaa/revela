// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';

/**
 * Validation au bord (ADR-009 §1) : applique un schéma Zod à une entrée de transport
 * (`@Body`, query/param structuré) via `safeParse` et lève un `BadRequestException` (400)
 * en cas d'échec — au lieu de laisser fuiter une `ZodError` brute (→ 500) ou de typer le
 * body « inline » sans aucune validation à l'exécution.
 *
 * C'est la brique réutilisable qui remplace les `schema.parse()` bruts et les
 * `@Body() body: { champ?: type }` non validés sur la branche admin de mutation.
 *
 * Usage : `@Body(new ZodValidationPipe(monSchema)) body: MonType`.
 */
export class ZodValidationPipe<TSchema extends z.ZodType> implements PipeTransform {
    public constructor(
        private readonly schema: TSchema,
        private readonly message = 'Corps de requête invalide.'
    ) {}

    public transform(value: unknown): z.infer<TSchema> {
        const parsed = this.schema.safeParse(value);
        if (!parsed.success) {
            throw new BadRequestException({
                error: this.message,
                issues: parsed.error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
        return parsed.data;
    }
}
