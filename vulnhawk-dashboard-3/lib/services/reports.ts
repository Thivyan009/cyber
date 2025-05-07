import { prisma } from '../db'

export async function getReports() {
  return prisma.report.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      vulnerabilitiesList: true
    }
  })
}

export async function getReport(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      vulnerabilitiesList: true
    }
  })
}

export async function createReport(data: {
  target: string
  status: string
  critical: number
  high: number
  medium: number
  low: number
  rawOutput?: any
  enhancedReport?: any
}) {
  return prisma.report.create({
    data,
    include: {
      vulnerabilitiesList: true
    }
  })
}

export async function updateReportStatus(id: string, status: string) {
  return prisma.report.update({
    where: { id },
    data: {
      status
    }
  })
} 