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
    Res,
    UploadedFile,
    UnauthorizedException,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import {
    type CreateAdminCoachBody,
    createAdminCoachBodySchema,
    type UpdateAdminCoachBody,
    updateAdminCoachBodySchema,
} from '@aor/types';

import { ZodValidationPipe } from '@src/presentation/zod-validation.pipe';
import type { CreateAdminCoachUseCase } from '@src/application/admin/coaches/create-admin-coach.usecase';
import type { DeleteAdminCoachUseCase } from '@src/application/admin/coaches/delete-admin-coach.usecase';
import type { GetAdminCoachAvatarUseCase } from '@src/application/admin/coaches/get-admin-coach-avatar.usecase';
import type { GetAdminCoachDetailUseCase } from '@src/application/admin/coaches/get-admin-coach-detail.usecase';
import type { ListAdminCoachesUseCase } from '@src/application/admin/coaches/list-admin-coaches.usecase';
import type { UpdateAdminCoachUseCase } from '@src/application/admin/coaches/update-admin-coach.usecase';
import type { UploadAdminCoachAvatarUseCase } from '@src/application/admin/coaches/upload-admin-coach-avatar.usecase';
import { ParticipantAvatarExceptionFilter } from '@src/presentation/participant-session/participant-avatar-exception.filter';
import { ADMIN_AUTH_CONFIG_PORT_SYMBOL, type IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import { COACHES_REPOSITORY_PORT_SYMBOL, type ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { adminCoachDetailToJson, coachToAdminJson } from './admin.presenters';
import {
    CREATE_ADMIN_COACH_USE_CASE_SYMBOL,
    DELETE_ADMIN_COACH_USE_CASE_SYMBOL,
    GET_ADMIN_COACH_DETAIL_USE_CASE_SYMBOL,
    GET_ADMIN_COACH_AVATAR_USE_CASE_SYMBOL,
    UPLOAD_ADMIN_COACH_AVATAR_USE_CASE_SYMBOL,
    LIST_ADMIN_COACHES_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COACH_USE_CASE_SYMBOL,
} from './admin.tokens';

@ApiTags('admin-coaches')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminCoachesController {
    public constructor(
        @Inject(LIST_ADMIN_COACHES_USE_CASE_SYMBOL)
        private readonly listAdminCoaches: ListAdminCoachesUseCase,
        @Inject(CREATE_ADMIN_COACH_USE_CASE_SYMBOL)
        private readonly createAdminCoach: CreateAdminCoachUseCase,
        @Inject(GET_ADMIN_COACH_DETAIL_USE_CASE_SYMBOL)
        private readonly getAdminCoachDetail: GetAdminCoachDetailUseCase,
        @Inject(GET_ADMIN_COACH_AVATAR_USE_CASE_SYMBOL)
        private readonly getAdminCoachAvatar: GetAdminCoachAvatarUseCase,
        @Inject(UPLOAD_ADMIN_COACH_AVATAR_USE_CASE_SYMBOL)
        private readonly uploadAdminCoachAvatar: UploadAdminCoachAvatarUseCase,
        @Inject(UPDATE_ADMIN_COACH_USE_CASE_SYMBOL)
        private readonly updateAdminCoach: UpdateAdminCoachUseCase,
        @Inject(DELETE_ADMIN_COACH_USE_CASE_SYMBOL)
        private readonly deleteAdminCoach: DeleteAdminCoachUseCase,
        @Inject(ADMIN_AUTH_CONFIG_PORT_SYMBOL)
        private readonly authConfig: IAdminAuthConfigPort,
        @Inject(COACHES_REPOSITORY_PORT_SYMBOL)
        private readonly coaches: ICoachesReadPort
    ) {}

    private ensureCoachEntityAccess(coachId: number, user: JwtValidatedUser): void {
        if (user.scope !== 'coach') {
            return;
        }
        if (user.coachId !== coachId) {
            throw new UnauthorizedException();
        }
    }

    /** Upload réservé au propriétaire : coach → son id ; super-admin → ligne sentinelle Admin uniquement. */
    private async ensureCoachAvatarUploadAccess(coachId: number, user: JwtValidatedUser): Promise<void> {
        if (user.scope === 'coach') {
            if (user.coachId !== coachId) {
                throw new UnauthorizedException();
            }
            return;
        }
        const adminCoach = await this.coaches.findByUsername(this.authConfig.superAdminUsername);
        if (!adminCoach || adminCoach.id !== coachId) {
            throw new UnauthorizedException(
                'Vous ne pouvez modifier que la photo de votre propre compte (coach Admin).'
            );
        }
    }

    private isAdminCoachUsername(username: string): boolean {
        return username === this.authConfig.superAdminUsername.trim().toLowerCase();
    }

    @Get('coaches')
    public async listCoaches(@Req() req: { user: JwtValidatedUser }) {
        const coaches = await this.listAdminCoaches.execute();
        const visibleCoaches =
            req.user.scope === 'coach' ? coaches.filter(coach => coach.id === req.user.coachId) : coaches;
        return Promise.all(
            visibleCoaches.map(async coach => {
                const avatar_url = await this.coaches.resolveAvatarUrl(coach.id);
                return coachToAdminJson(coach, {
                    isAdmin: this.isAdminCoachUsername(coach.username),
                    avatar_url,
                });
            })
        );
    }

    @Post('coaches')
    public async createCoach(
        @Req() req: { user: JwtValidatedUser },
        @Body(new ZodValidationPipe(createAdminCoachBodySchema)) body: CreateAdminCoachBody
    ) {
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException();
        }
        const coach = await this.createAdminCoach.execute(body);
        return coachToAdminJson(coach, { isAdmin: this.isAdminCoachUsername(coach.username) });
    }

    @Get('coaches/:coachId')
    public async getCoach(@Param('coachId', ParseIntPipe) coachId: number, @Req() req: { user: JwtValidatedUser }) {
        this.ensureCoachEntityAccess(coachId, req.user);
        const detail = await this.getAdminCoachDetail.execute(coachId);
        return adminCoachDetailToJson(detail, { isAdmin: this.isAdminCoachUsername(detail.coach.username) });
    }

    @Get('coaches/:coachId/avatar')
    @UseFilters(ParticipantAvatarExceptionFilter)
    public async getCoachAvatar(
        @Param('coachId', ParseIntPipe) coachId: number,
        @Req() req: { user: JwtValidatedUser },
        @Res() res: Response
    ) {
        this.ensureCoachEntityAccess(coachId, req.user);
        const { buffer, mimeType } = await this.getAdminCoachAvatar.execute(coachId);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'private, max-age=86400');
        res.send(buffer);
    }

    @Post('coaches/:coachId/avatar')
    @UseInterceptors(FileInterceptor('file'))
    @UseFilters(ParticipantAvatarExceptionFilter)
    public async uploadCoachAvatar(
        @Param('coachId', ParseIntPipe) coachId: number,
        @Req() req: { user: JwtValidatedUser },
        @UploadedFile() file: Express.Multer.File | undefined
    ) {
        await this.ensureCoachAvatarUploadAccess(coachId, req.user);
        return this.uploadAdminCoachAvatar.execute(coachId, file);
    }

    @Patch('coaches/:coachId')
    public async updateCoach(
        @Param('coachId', ParseIntPipe) coachId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body(new ZodValidationPipe(updateAdminCoachBodySchema)) body: UpdateAdminCoachBody
    ) {
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException(
                'La modification du profil coach est réservée à l’admin. Utilisez la page profil pour changer votre photo.'
            );
        }
        const coach = await this.updateAdminCoach.execute(coachId, body);
        return coachToAdminJson(coach, { isAdmin: this.isAdminCoachUsername(coach.username) });
    }

    @Delete('coaches/:coachId')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteCoach(
        @Param('coachId', ParseIntPipe) coachId: number,
        @Req() req: { user: JwtValidatedUser }
    ): Promise<void> {
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException();
        }
        await this.deleteAdminCoach.execute(coachId);
    }
}
