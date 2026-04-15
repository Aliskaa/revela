import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class ListAdminCoachesUseCase {
    public constructor(
        private readonly ports: {
            readonly coaches: ICoachesReadPort;
        }
    ) {}

    public async execute() {
        return this.ports.coaches.listAll();
    }
}
