// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UnauthorizedException,
    UploadedFile,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { AddParticipantToCompanyUseCase } from '@src/application/admin/companies/add-participant-to-company.usecase';
import type { CreateAdminCompanyUseCase } from '@src/application/admin/companies/create-admin-company.usecase';
import type { DeleteAdminCompanyUseCase } from '@src/application/admin/companies/delete-admin-company.usecase';
import type { GetAdminCompanyUseCase } from '@src/application/admin/companies/get-admin-company.usecase';
import type { ListAdminCompaniesUseCase } from '@src/application/admin/companies/list-admin-companies.usecase';
import type { UpdateAdminCompanyUseCase } from '@src/application/admin/companies/update-admin-company.usecase';
import type { ImportParticipantsCsvUseCase } from '@src/application/admin/participants/import-participants-csv.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { companyToAdminJson } from './admin.presenters';
import {
    ADD_PARTICIPANT_TO_COMPANY_USE_CASE_SYMBOL,
    CREATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    GET_ADMIN_COMPANY_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL,
    LIST_ADMIN_COMPANIES_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
} from './admin.tokens';

@ApiTags('admin-companies')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminCompaniesController {
    public constructor(
        @Inject(LIST_ADMIN_COMPANIES_USE_CASE_SYMBOL)
        private readonly listAdminCompanies: ListAdminCompaniesUseCase,
        @Inject(GET_ADMIN_COMPANY_USE_CASE_SYMBOL)
        private readonly getAdminCompany: GetAdminCompanyUseCase,
        @Inject(CREATE_ADMIN_COMPANY_USE_CASE_SYMBOL)
        private readonly createAdminCompany: CreateAdminCompanyUseCase,
        @Inject(UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL)
        private readonly updateAdminCompany: UpdateAdminCompanyUseCase,
        @Inject(DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL)
        private readonly deleteAdminCompany: DeleteAdminCompanyUseCase,
        @Inject(IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL)
        private readonly importParticipantsCsv: ImportParticipantsCsvUseCase,
        @Inject(ADD_PARTICIPANT_TO_COMPANY_USE_CASE_SYMBOL)
        private readonly addParticipantToCompany: AddParticipantToCompanyUseCase
    ) {}

    @Get('companies')
    public async listCompanies(@Req() req: { user: JwtValidatedUser }) {
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        const rows = await this.listAdminCompanies.execute({ coachId });
        return rows.map(companyToAdminJson);
    }

    @Get('companies/:companyId')
    public async getCompany(@Param('companyId', ParseIntPipe) companyId: number) {
        const row = await this.getAdminCompany.execute(companyId);
        return companyToAdminJson(row);
    }

    @Post('companies')
    public async createCompany(
        @Req() req: { user: JwtValidatedUser },
        @Body() body: { name?: string; contact_name?: string | null; contact_email?: string | null }
    ) {
        // Création d'entreprise réservée à l'admin (cf. P07 du suivi produit 2026-05-02).
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException("La création d'une entreprise est réservée à l'admin.");
        }
        const row = await this.createAdminCompany.execute(body);
        return companyToAdminJson(row);
    }

    @Patch('companies/:companyId')
    public async updateCompany(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Body() body: { name?: string; contact_name?: string | null; contact_email?: string | null }
    ) {
        const row = await this.updateAdminCompany.execute(companyId, body);
        return companyToAdminJson(row);
    }

    @Delete('companies/:companyId')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteCompany(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Req() req: { user: JwtValidatedUser }
    ): Promise<void> {
        // Suppression d'entreprise réservée à l'admin (cf. P07 du suivi produit 2026-05-02).
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException("La suppression d'une entreprise est réservée à l'admin.");
        }
        await this.deleteAdminCompany.execute(companyId);
    }

    @Post('companies/:companyId/participants/import')
    @UseInterceptors(FileInterceptor('file'))
    public async importParticipantsForCompany(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Req() req: { user: JwtValidatedUser },
        @UploadedFile() file: Express.Multer.File | undefined
    ) {
        // L'import CSV en masse est réservé à l'admin. Les coachs ajoutent les participants
        // unitairement via le formulaire de la fiche campagne (cf. P08 du suivi produit).
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException(
                "L'import CSV en masse est réservé à l'admin. Pour ajouter un participant, utilisez le formulaire d'ajout unitaire depuis la fiche campagne."
            );
        }
        await this.getAdminCompany.execute(companyId);
        return this.importParticipantsCsv.execute(file?.buffer, { forcedCompanyId: companyId });
    }

    @Post('companies/:companyId/participants')
    public async addParticipantToCompanyEndpoint(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body()
        body: {
            first_name?: string;
            last_name?: string;
            email?: string;
            organisation?: string | null;
            direction?: string | null;
            service?: string | null;
            function_level?: string | null;
        }
    ) {
        // Ouvert à l'admin et au coach. Pour le coach, le use case vérifie qu'il a au moins
        // une campagne dans cette entreprise. Cf. P08 du suivi produit 2026-05-02.
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        return this.addParticipantToCompany.execute(companyId, body, { coachId });
    }
}
