import { prisma } from '../db'

export async function getDashboardData() {
  const reports = await prisma.report.findMany({
    orderBy: {
      date: 'desc'
    },
    take: 5
  })

  const totalAttacks = await prisma.report.count()
  const vulnerabilitiesFound = await prisma.vulnerability.count()
  const criticalIssues = await prisma.vulnerability.count({
    where: {
      severity: 'critical'
    }
  })

  // Calculate security score based on vulnerabilities
  const vulnerabilities = await prisma.vulnerability.groupBy({
    by: ['severity'],
    _count: true
  })

  const securityScore = calculateSecurityScore(vulnerabilities)

  return {
    totalAttacks,
    vulnerabilitiesFound,
    criticalIssues,
    securityScore,
    recentReports: reports,
    vulnerabilitySummary: {
      critical: vulnerabilities.find(v => v.severity === 'critical')?._count || 0,
      high: vulnerabilities.find(v => v.severity === 'high')?._count || 0,
      medium: vulnerabilities.find(v => v.severity === 'medium')?._count || 0,
      low: vulnerabilities.find(v => v.severity === 'low')?._count || 0
    }
  }
}

function calculateSecurityScore(vulnerabilities: any[]) {
  const weights = {
    critical: 1,
    high: 0.8,
    medium: 0.5,
    low: 0.2
  }

  let totalWeight = 0
  let maxWeight = 0

  vulnerabilities.forEach(v => {
    const weight = weights[v.severity as keyof typeof weights] || 0
    totalWeight += weight * v._count
    maxWeight += weight * 10 // Assuming max 10 vulnerabilities per severity
  })

  return Math.max(0, Math.min(100, Math.round(100 - (totalWeight / maxWeight) * 100)))
} 