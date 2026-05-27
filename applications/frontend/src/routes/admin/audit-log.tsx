// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AuditLogPage } from '@/components/scoped/AuditLogPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/audit-log')({
    component: AuditLogPage,
});
