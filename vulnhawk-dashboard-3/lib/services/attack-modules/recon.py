import nmap
import socket
import requests
from urllib.parse import urlparse
import dns.resolver
import concurrent.futures
from typing import Dict, List

class ReconModule:
    def __init__(self, target: str):
        self.target = target
        self.results = {
            "open_ports": [],
            "subdomains": [],
            "technologies": [],
            "info_disclosure": []
        }
        
    def scan_ports(self) -> List[Dict]:
        """Scan for open ports using nmap"""
        try:
            nm = nmap.PortScanner()
            nm.scan(self.target, arguments='-F -T4')  # Fast scan of common ports
            
            open_ports = []
            for host in nm.all_hosts():
                for proto in nm[host].all_protocols():
                    ports = nm[host][proto].keys()
                    for port in ports:
                        state = nm[host][proto][port]['state']
                        if state == 'open':
                            service = nm[host][proto][port].get('name', 'unknown')
                            open_ports.append({
                                'port': port,
                                'service': service,
                                'state': state
                            })
            return open_ports
        except Exception as e:
            print(f"Port scan error: {str(e)}")
            return []

    def find_subdomains(self) -> List[str]:
        """Find subdomains using DNS enumeration"""
        try:
            domain = urlparse(self.target).netloc
            subdomains = set()
            
            # Common subdomain prefixes
            prefixes = ['www', 'mail', 'ftp', 'admin', 'blog', 'dev', 'test', 'api']
            
            for prefix in prefixes:
                try:
                    subdomain = f"{prefix}.{domain}"
                    answers = dns.resolver.resolve(subdomain, 'A')
                    if answers:
                        subdomains.add(subdomain)
                except:
                    continue
                    
            return list(subdomains)
        except Exception as e:
            print(f"Subdomain enumeration error: {str(e)}")
            return []

    def detect_technologies(self) -> List[Dict]:
        """Detect technologies used by the target"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(self.target, headers=headers, timeout=10)
            
            technologies = []
            
            # Check for common headers
            if 'X-Powered-By' in response.headers:
                technologies.append({
                    'type': 'framework',
                    'name': response.headers['X-Powered-By']
                })
                
            # Check for common server headers
            if 'Server' in response.headers:
                technologies.append({
                    'type': 'server',
                    'name': response.headers['Server']
                })
                
            return technologies
        except Exception as e:
            print(f"Technology detection error: {str(e)}")
            return []

    def check_info_disclosure(self) -> List[Dict]:
        """Check for information disclosure"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(self.target, headers=headers, timeout=10)
            
            disclosures = []
            
            # Check for common information disclosure patterns
            patterns = [
                ('error', 'Error messages'),
                ('stack trace', 'Stack traces'),
                ('debug', 'Debug information'),
                ('version', 'Version information')
            ]
            
            for pattern, description in patterns:
                if pattern in response.text.lower():
                    disclosures.append({
                        'type': 'information_disclosure',
                        'description': description,
                        'details': f"Found {pattern} in response"
                    })
                    
            return disclosures
        except Exception as e:
            print(f"Information disclosure check error: {str(e)}")
            return []

    def run(self) -> Dict:
        """Run all reconnaissance checks"""
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            port_future = executor.submit(self.scan_ports)
            subdomain_future = executor.submit(self.find_subdomains)
            tech_future = executor.submit(self.detect_technologies)
            disclosure_future = executor.submit(self.check_info_disclosure)
            
            self.results['open_ports'] = port_future.result()
            self.results['subdomains'] = subdomain_future.result()
            self.results['technologies'] = tech_future.result()
            self.results['info_disclosure'] = disclosure_future.result()
            
        return self.results 