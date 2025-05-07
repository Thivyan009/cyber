import { spawn } from 'node:child_process'
import { prisma } from '../db'
import path from 'node:path'
import fs from 'node:fs'
import { generateEnhancedReport } from './gemini'

interface ModuleResults {
  [key: string]: Array<{
    type: string;
    description: string;
    details?: string;
  }>;
}

interface ScanResults {
  [moduleName: string]: ModuleResults;
}

export async function startAttack(target: string, modules: string[]) {
  try {
    console.log('Starting attack with params:', { target, modules })

    // Create initial report
    const report = await prisma.report.create({
      data: {
        target,
        status: 'in-progress',
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        rawOutput: null,
        enhancedReport: null
      }
    })
    console.log('Created report:', report.id)

    // Verify Python script exists
    const workspaceRoot = process.cwd()
    const pythonScript = path.join(workspaceRoot, 'lib', 'services', 'attack-modules', 'attack_runner.py')
    
    if (!fs.existsSync(pythonScript)) {
      throw new Error(`Python script not found at ${pythonScript}`)
    }
    console.log('Found Python script at:', pythonScript)

    // Start Python script with detailed error handling
    const pythonProcess = spawn('python3', [pythonScript, target, ...modules], {
      cwd: workspaceRoot,
      env: { 
        ...process.env, 
        PYTHONPATH: path.join(workspaceRoot, 'lib', 'services', 'attack-modules'),
        PYTHONUNBUFFERED: '1'
      }
    })

    let output = ''
    let error = ''

    pythonProcess.stdout.on('data', (data) => {
      const str = data.toString()
      output += str
      console.log('Python stdout:', str)
    })

    pythonProcess.stderr.on('data', (data) => {
      const str = data.toString()
      error += str
      console.error('Python stderr:', str)
    })

    return new Promise((resolve, reject) => {
      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err)
        reject(new Error(`Failed to start Python process: ${err.message}`))
      })

      pythonProcess.on('close', async (code) => {
        console.log('Python process closed with code:', code)
        console.log('Final output:', output)
        console.log('Final error:', error)

        try {
          if (code !== 0) {
            throw new Error(`Python script exited with code ${code}: ${error}`)
          }

          // Find the JSON output in the logs
          const jsonMatch = output.match(/\{.*\}/s)
          if (!jsonMatch) {
            throw new Error('No JSON output found in Python script output')
          }

          // Parse the output
          const results = JSON.parse(jsonMatch[0])
          console.log('Parsed results:', results)

          // Process findings and update report
          const findings = results.recon?.info_disclosure || []
          const severityCounts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: findings.length // All info disclosure findings are low severity
          }

          // Create vulnerability records
          for (const finding of findings) {
            await prisma.vulnerability.create({
              data: {
                title: finding.type || 'Unknown Vulnerability',
                description: finding.description || 'No description provided',
                severity: 'low',
                module: 'recon',
                findingType: finding.type || 'unknown',
                details: finding,
                reportId: report.id
              }
            })
          }

          // Update report with results
          await prisma.report.update({
            where: { id: report.id },
            data: {
              status: 'completed',
              critical: severityCounts.critical,
              high: severityCounts.high,
              medium: severityCounts.medium,
              low: severityCounts.low,
              rawOutput: results
            }
          })

          // Generate enhanced report using Gemini AI
          try {
            const enhancedReport = await generateEnhancedReport(results)
            
            // Update report with enhanced report
            await prisma.report.update({
              where: { id: report.id },
              data: {
                enhancedReport
              }
            })
          } catch (aiError) {
            console.error('Error generating enhanced report:', aiError)
            // Continue even if AI processing fails
          }

          resolve(report)
        } catch (err) {
          console.error('Error processing attack results:', err)
          
          // Update report with error status
          await prisma.report.update({
            where: { id: report.id },
            data: {
              status: 'error',
              rawOutput: { 
                error: err instanceof Error ? err.message : 'Unknown error',
                pythonOutput: output,
                pythonError: error
              }
            }
          })
          reject(err)
        }
      })
    })
  } catch (err) {
    console.error('Error in startAttack:', err)
    throw err
  }
}

function determineSeverity(module: string, finding: { type: string; description: string; details?: Record<string, unknown> }): 'critical' | 'high' | 'medium' | 'low' {
  // Map module and finding type to severity
  const severityMap: Record<string, Record<string, 'critical' | 'high' | 'medium' | 'low'>> = {
    recon: {
      'open_ports': 'low',
      'ssl_issues': 'high',
      'information_disclosure': 'medium'
    },
    auth: {
      'weak_passwords': 'high',
      'session_fixation': 'high',
      'auth_bypass': 'critical'
    },
    client: {
      'xss': 'high',
      'csrf': 'medium',
      'clickjacking': 'medium'
    },
    file: {
      'sql_injection': 'critical',
      'file_upload': 'high',
      'path_traversal': 'high'
    }
  }

  return severityMap[module]?.[finding.type] || 'low'
}

export async function getAttackProgress(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { vulnerabilitiesList: true },
  })

  if (!report) {
    return {
      status: 'idle',
      progress: 0,
      currentModule: '',
    }
  }

  // Calculate progress based on status
  let progress = 0
  switch (report.status) {
    case 'in-progress':
      progress = 50
      break
    case 'completed':
      progress = 100
      break
    case 'error':
      progress = 0
      break
    default:
      progress = 0
  }

  return {
    status: report.status,
    progress,
    currentModule: report.status === 'completed' ? 'Completed' : 'Running attack modules',
    vulnerabilitiesFound: report.vulnerabilitiesList.length,
    reportId: report.id,
  }
} 