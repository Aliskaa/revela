import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const backendSrcRoot = join(process.cwd(), 'applications', 'backend', 'src');

const forbiddenImportSnippets = [
    '@src/interfaces/security/IPasswordHasher.port',
    '@src/interfaces/security/IPasswordVerifier.port',
    '@src/interfaces/scoring/ICalculateScoringUseCase.port',
    '@src/interfaces/scoring/IScorePersistence.port',
    '@src/infrastructure/crypto/scrypt-password',
    '@src/infrastructure/crypto/scrypt-password.adapter',
    '@src/infrastructure/scoring/noop-score-persistence.adapter',
    '@src/domain/admin/invitation-token-status',
    '@src/domain/admin/admin-dashboard-snapshot',
    '@src/domain/admin/admin-login-result',
    '@src/application/responses/submission-validation',
    '@src/application/responses/peer-rating-stored-label',
    '@src/application/admin/responses/csv-datetime.format',
    '@src/application/admin/participants/import-participants-csv.parse',
];

const collectTsFiles = root => {
    const output = [];
    for (const entry of readdirSync(root)) {
        const absolute = join(root, entry);
        const stat = statSync(absolute);
        if (stat.isDirectory()) {
            output.push(...collectTsFiles(absolute));
            continue;
        }
        if (absolute.endsWith('.ts') || absolute.endsWith('.tsx')) {
            output.push(absolute);
        }
    }
    return output;
};

const violations = [];
for (const filePath of collectTsFiles(backendSrcRoot)) {
    const content = readFileSync(filePath, 'utf8');
    for (const snippet of forbiddenImportSnippets) {
        if (content.includes(snippet)) {
            violations.push({ filePath, snippet });
        }
    }
}

if (violations.length > 0) {
    console.error('Forbidden legacy backend imports detected:');
    for (const violation of violations) {
        console.error(`- ${relative(process.cwd(), violation.filePath)} -> ${violation.snippet}`);
    }
    process.exit(1);
}

console.log('Backend shared-import guard passed.');
