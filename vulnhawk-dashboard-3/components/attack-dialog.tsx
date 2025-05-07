"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowRight, CheckCircle, Info, Shield, Target, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"

export function AttackDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("setup")
  const [targetUrl, setTargetUrl] = useState("")
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [testScope, setTestScope] = useState<"specific-url" | "whole-site">("specific-url")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attackProgress, setAttackProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    currentModule?: string;
    progress: number;
    message?: string;
    completedModules?: number;
    totalModules?: number;
    reportId?: string;
  }>({
    status: 'idle',
    progress: 0
  });

  const modules = [
    {
      id: "recon",
      name: "Reconnaissance",
      description: "Gather information about the target system",
      price: 80,
      details:
        "Includes subdomain enumeration, port scanning, technology stack identification, and information disclosure detection.",
    },
    {
      id: "auth",
      name: "Authentication & Session",
      description: "Test authentication mechanisms and session management",
      price: 80,
      details:
        "Tests for weak passwords, brute force vulnerabilities, session fixation, and insecure authentication flows.",
    },
    {
      id: "privilege",
      name: "Privilege Escalation",
      description: "Attempt to gain higher privileges than intended",
      price: 80,
      details:
        "Tests for horizontal and vertical privilege escalation, role-based access control issues, and insecure direct object references.",
    },
    {
      id: "client",
      name: "Client-side Exploits",
      description: "Test for XSS, CSRF, and other client-side vulnerabilities",
      price: 80,
      details:
        "Includes testing for cross-site scripting (XSS), cross-site request forgery (CSRF), clickjacking, and client-side validation bypasses.",
    },
    {
      id: "file",
      name: "File/Data Exploits",
      description: "Test for injection, file uploads, and data leakage",
      price: 80,
      details:
        "Tests for SQL injection, NoSQL injection, command injection, insecure file uploads, and sensitive data exposure.",
    },
    {
      id: "post",
      name: "Post-Exploitation",
      description: "Assess impact of successful exploits",
      price: 80,
      details:
        "Evaluates the potential impact of successful exploits, including data exfiltration paths, lateral movement possibilities, and persistence mechanisms.",
    },
  ]

  const totalPrice = selectedModules.length === modules.length ? 480 : selectedModules.length * 80

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]))
  }

  const handleSelectAll = () => {
    if (selectedModules.length === modules.length) {
      setSelectedModules([])
    } else {
      setSelectedModules(modules.map((m) => m.id))
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (attackProgress.status === 'running') {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch('/api/attack/progress');
          const data = await response.json();
          
          setAttackProgress(data);
          
          if (data.status === 'completed' && data.reportId) {
            clearInterval(intervalId);
            setTimeout(() => {
              router.push(`/reports/${data.reportId}`);
            }, 1000);
          } else if (data.status === 'error') {
            clearInterval(intervalId);
            setAttackProgress({
              status: 'error',
              progress: 0,
              message: 'Failed to fetch progress updates'
            });
          }
        } catch (error) {
          console.error('Failed to fetch progress:', error);
          setAttackProgress(prev => ({
            ...prev,
            status: 'error',
            message: 'Failed to fetch progress updates'
          }));
          clearInterval(intervalId);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [attackProgress.status, router]);

  const handleContinue = async () => {
    if (activeTab === "setup") {
      setActiveTab("consent")
    } else if (activeTab === "consent") {
      setActiveTab("payment")
    } else if (activeTab === "payment") {
      try {
        setIsLoading(true)
        setError(null)
        
        // Start the attack
        const response = await fetch('/api/attack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: targetUrl,
            scope: testScope,
            modules: selectedModules
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to start attack')
        }

        const data = await response.json()
        
        // Update progress state
        setAttackProgress({
          status: 'running',
          progress: 0,
          currentModule: 'Initializing...',
          reportId: data.id
        });
        
        // Don't close dialog or reset form yet
        // Let the progress tracking handle navigation
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setAttackProgress({
          status: 'error',
          progress: 0,
          message: err instanceof Error ? err.message : 'An error occurred'
        });
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (activeTab === "consent") {
      setActiveTab("setup")
    } else if (activeTab === "payment") {
      setActiveTab("consent")
    }
  }

  const handleClose = () => {
    setOpen(false)
    // Reset form state when dialog is closed
    setTimeout(() => {
      setActiveTab("setup")
      setTargetUrl("")
      setSelectedModules([])
      setTermsAccepted(false)
      setTestScope("specific-url")
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          type="button"
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <Target className="h-4 w-4" />
          <span>Launch Attack</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Launch Attack</DialogTitle>
          <DialogDescription>Configure and execute a real-world penetration test on your target.</DialogDescription>
        </DialogHeader>

        {attackProgress.status === 'running' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attack Progress</span>
                <span className="text-sm text-muted-foreground">
                  {attackProgress.progress}% ({attackProgress.completedModules}/{attackProgress.totalModules} modules)
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${attackProgress.progress}%` }}
                />
              </div>
            </div>
            
            <div className="rounded-md border p-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {attackProgress.currentModule || 'Running attack...'}
                </span>
              </div>
              {attackProgress.completedModules && attackProgress.totalModules && (
                <p className="text-xs text-muted-foreground mt-2">
                  Module {attackProgress.completedModules} of {attackProgress.totalModules}
                </p>
              )}
            </div>
          </div>
        )}

        {attackProgress.status === 'error' && (
          <div className="rounded-md bg-red-500/10 p-4 mt-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="ml-2 text-sm font-medium text-red-500">Error</h3>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{attackProgress.message}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => {
                setAttackProgress({ status: 'idle', progress: 0 });
                setActiveTab("setup");
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {attackProgress.status === 'idle' && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
              <TabsTrigger value="setup">Attack Setup</TabsTrigger>
              <TabsTrigger value="consent" disabled={!targetUrl || selectedModules.length === 0}>
                Terms & Consent
              </TabsTrigger>
              <TabsTrigger value="payment" disabled={!termsAccepted}>
                Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target-url">Target URL</Label>
                  <Input
                    id="target-url"
                    placeholder="https://example.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Enter the full URL including http:// or https://</p>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Test Scope</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="specific-url"
                        name="test-scope"
                        value="specific-url"
                        checked={testScope === "specific-url"}
                        onChange={() => setTestScope("specific-url")}
                        className="h-4 w-4 text-primary"
                      />
                      <Label htmlFor="specific-url" className="font-normal cursor-pointer">
                        Test specific URL only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="whole-site"
                        name="test-scope"
                        value="whole-site"
                        checked={testScope === "whole-site"}
                        onChange={() => setTestScope("whole-site")}
                        className="h-4 w-4 text-primary"
                      />
                      <Label htmlFor="whole-site" className="font-normal cursor-pointer">
                        Test the entire site (more comprehensive)
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {testScope === "specific-url"
                        ? "Only the exact URL will be tested. This is faster but less comprehensive."
                        : "The entire site will be crawled and tested. This is more thorough but takes longer."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope-notes">Scope Notes (Optional)</Label>
                  <Textarea
                    id="scope-notes"
                    placeholder="Any specific areas to focus on or exclude from testing"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Select Attack Modules</Label>
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedModules.length === modules.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose which attack vectors to test. Select all for a comprehensive test and save 20%.
                  </p>
                </div>

                <div className="space-y-3 max-h-[200px] sm:max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 -mr-2">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-start space-x-2 sm:space-x-3 rounded-lg border p-2 sm:p-3">
                      <Checkbox
                        id={module.id}
                        checked={selectedModules.includes(module.id)}
                        onCheckedChange={() => handleModuleToggle(module.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center flex-wrap sm:flex-nowrap">
                          <Label htmlFor={module.id} className="text-sm sm:text-base font-medium cursor-pointer mr-2">
                            {module.name}
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{module.details}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="ml-auto font-medium mt-1 sm:mt-0">${module.price}</div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 flex-wrap sm:flex-nowrap">
                  <div>
                    <div className="text-base sm:text-lg font-bold">
                      Total: ${totalPrice}
                      {selectedModules.length === modules.length && (
                        <span className="ml-2 text-xs sm:text-sm font-normal text-green-500">(20% discount applied)</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">One-time payment for this test</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="consent" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="rounded-md bg-amber-500/10 p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h3 className="ml-2 text-sm font-medium text-amber-500">Important Notice</h3>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    VulnHawk X performs real attacks on your systems. You must have proper authorization to test the
                    target.
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="terms">
                    <AccordionTrigger>Terms of Service</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      <p className="mb-2">By using VulnHawk X, you agree to the following terms:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>You have legal authorization to test the target system</li>
                        <li>You understand that real attacks will be performed</li>
                        <li>VulnHawk X is not responsible for any damage or disruption caused to your systems</li>
                        <li>
                          You will not use VulnHawk X to attack systems you do not own or have explicit permission to test
                        </li>
                        <li>Test results are confidential and for your use only</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="privacy">
                    <AccordionTrigger>Privacy Policy</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      <p className="mb-2">VulnHawk X collects and processes the following data:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Target URL and scope information you provide</li>
                        <li>Vulnerability data discovered during testing</li>
                        <li>Screenshots and logs of successful exploits</li>
                        <li>All data is encrypted at rest and in transit</li>
                        <li>Data is retained for 90 days unless you request earlier deletion</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="liability">
                    <AccordionTrigger>Limitation of Liability</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      <p className="mb-2">By using VulnHawk X, you acknowledge:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>VulnHawk X performs real attacks that may impact system performance</li>
                        <li>We are not liable for any downtime, data loss, or other damages</li>
                        <li>You are responsible for ensuring your systems can handle the tests</li>
                        <li>It is recommended to test on staging environments first</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex items-start space-x-2 sm:space-x-3 pt-4">
                  <Checkbox
                    id="terms-dialog"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="terms-dialog" className="text-xs sm:text-sm font-medium cursor-pointer">
                      I confirm that I have read and agree to the Terms of Service, Privacy Policy, and Limitation of
                      Liability
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      I have legal authorization to test the specified target and understand the potential risks involved.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Target</h3>
                      <p className="text-sm text-muted-foreground">{targetUrl || "https://example.com"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scope: {testScope === "specific-url" ? "Specific URL only" : "Entire site"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("setup")}>
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <h3 className="font-medium mb-2">Selected Modules</h3>
                  <div className="space-y-2">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          {selectedModules.includes(module.id) ? (
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          ) : (
                            <div className="mr-2 h-4 w-4" />
                          )}
                          <span className={!selectedModules.includes(module.id) ? "text-muted-foreground" : ""}>
                            {module.name}
                          </span>
                        </div>
                        {selectedModules.includes(module.id) && <span>${module.price}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>${selectedModules.length * 80}</span>
                  </div>
                  {selectedModules.length === modules.length && (
                    <div className="flex items-center justify-between text-green-500">
                      <span>Bundle Discount (20%)</span>
                      <span>-${selectedModules.length * 80 - 480}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {error && (
          <div className="rounded-md bg-red-500/10 p-4 mt-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="ml-2 text-sm font-medium text-red-500">Error</h3>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{error}</div>
          </div>
        )}

        <DialogFooter className="flex justify-between flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          {attackProgress.status === 'idle' && (
            <>
              {activeTab !== "setup" && (
                <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto" disabled={isLoading}>
                  Back
                </Button>
              )}
              {activeTab === "setup" && (
                <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto sm:mr-auto" disabled={isLoading}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={
                  isLoading ||
                  (activeTab === "setup" && (selectedModules.length === 0 || !targetUrl)) ||
                  (activeTab === "consent" && !termsAccepted)
                }
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : activeTab === "payment" ? (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start Attack
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
