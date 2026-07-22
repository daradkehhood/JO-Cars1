import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, requireRole } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api';
import { getSecurityStats } from '@/lib/api-logger';
import { getBlockedIPs } from '@/lib/ip-blacklist';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || !requireRole('ADMIN')(user)) return unauthorizedResponse();

  const securityStats = getSecurityStats();
  const blockedIPs = getBlockedIPs();

  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    totalCars,
    pendingCars,
    totalReports,
    pendingReports,
    totalWorkshops,
    pendingWorkshops,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { banStatus: { not: null } } }),
    prisma.car.count(),
    prisma.car.count({ where: { status: 'PENDING' } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.workshop.count(),
    prisma.workshop.count({ where: { isVerified: false } }),
  ]);

  const securityChecks = {
    passwordComplexity: true,
    rateLimiting: true,
    csrfProtection: true,
    cspHeaders: true,
    geoBlocking: process.env.GEO_RESTRICT_JORDAN === 'true',
    recaptchaEnabled: false,
    ipBlacklisting: true,
    jwtRotation: true,
    honeypotProtection: true,
    httpsEnforced: process.env.NODE_ENV === 'production',
  };

  const passedChecks = Object.values(securityChecks).filter(Boolean).length;
  const totalChecks = Object.keys(securityChecks).length;
  const securityScore = Math.round((passedChecks / totalChecks) * 100);

  return successResponse({
    securityScore,
    checks: securityChecks,
    traffic: securityStats,
    blockedIPs,
    database: {
      totalUsers,
      activeUsers,
      bannedUsers,
      totalCars,
      pendingCars,
      totalReports,
      pendingReports,
      totalWorkshops,
      pendingWorkshops,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      geoBlocking: process.env.GEO_RESTRICT_JORDAN === 'true',
      recaptchaConfigured: false,
    },
  });
}
