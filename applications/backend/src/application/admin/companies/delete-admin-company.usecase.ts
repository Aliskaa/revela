// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { ICompaniesReadPort, ICompaniesWritePort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type {
    IParticipantsAdminReadPort,
    IParticipantsWriterPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class DeleteAdminCompanyUseCase {
    public constructor(
        private readonly ports: {
            readonly companies: ICompaniesReadPort & ICompaniesWritePort;
            readonly participants: IParticipantsAdminReadPort & IParticipantsWriterPort;
        }
    ) {}

    /**
     * Suppression d'une entreprise avec effacement RGPD complet en cascade :
     * pour chaque participant rattaché, on efface réponses, scores et invitations
     * (`eraseParticipantRgpd`) avant de supprimer la company. Les campagnes de la
     * company sont supprimées par le `onDelete: cascade` du schéma.
     */
    public async execute(companyId: number): Promise<void> {
        const exists = await this.ports.companies.findById(companyId);
        if (!exists) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }

        const participants = await this.ports.participants.listByCompanyId(companyId);
        for (const participant of participants) {
            await this.ports.participants.eraseParticipantRgpd(participant.id);
        }

        await this.ports.companies.deleteById(companyId);
    }
}
