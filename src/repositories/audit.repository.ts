import { getAuditLogsCollection } from '../config/mongo';

type AuditAction = 'created' | 'updated' | 'deleted' | 'role_changed';

export const auditRepository = {
  async log(userId: string, action: AuditAction, performedBy: string, details?: object) {
    const collection = await getAuditLogsCollection();
    await collection.insertOne({
      userId,
      action,
      performedBy,
      timestamp: new Date(),
      details: details ?? {},
    });
  },
};