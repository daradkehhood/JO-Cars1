import prisma from './prisma';

interface AuditLogInput {
  action: string;
  actorId: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ip?: string;
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({ data: input });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
