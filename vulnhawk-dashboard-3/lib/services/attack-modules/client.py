import requests
from typing import Dict, List
import concurrent.futures
from urllib.parse import urljoin, urlparse
import re

class ClientModule:
    def __init__(self, target: str):
        self.target = target
        self.results = {
            "xss": [],
            "csrf": [],
            "clickjacking": [],
            "client_validation": []
        }
        
    def check_xss(self) -> List[Dict]:
        """Check for Cross-Site Scripting vulnerabilities"""
        try:
            issues = []
            
            # Test for reflected XSS
            xss_payloads = [
                '<script>alert(1)</script>',
                '"><script>alert(1)</script>',
                "'><script>alert(1)</script>",
                '<img src=x onerror=alert(1)>'
            ]
            
            # Test common parameters
            params = ['q', 'search', 'id', 'name', 'input']
            
            for param in params:
                for payload in xss_payloads:
                    try:
                        response = requests.get(
                            urljoin(self.target, f'/?{param}={payload}'),
                            timeout=5
                        )
                        if payload in response.text:
                            issues.append({
                                'type': 'xss',
                                'description': 'Potential XSS vulnerability',
                                'details': f"Reflected XSS in parameter: {param}"
                            })
                            break
                    except:
                        continue
                        
            return issues
        except Exception as e:
            print(f"XSS check error: {str(e)}")
            return []

    def check_csrf(self) -> List[Dict]:
        """Check for Cross-Site Request Forgery vulnerabilities"""
        try:
            issues = []
            
            # Test for CSRF protection
            try:
                response = requests.get(self.target, timeout=5)
                if 'csrf' not in response.text.lower() and 'xsrf' not in response.text.lower():
                    issues.append({
                        'type': 'csrf',
                        'description': 'Potential CSRF vulnerability',
                        'details': 'No CSRF token found in forms'
                    })
            except:
                pass
                
            return issues
        except Exception as e:
            print(f"CSRF check error: {str(e)}")
            return []

    def check_clickjacking(self) -> List[Dict]:
        """Check for Clickjacking vulnerabilities"""
        try:
            issues = []
            
            # Check for X-Frame-Options header
            try:
                response = requests.get(self.target, timeout=5)
                if 'X-Frame-Options' not in response.headers:
                    issues.append({
                        'type': 'clickjacking',
                        'description': 'Potential Clickjacking vulnerability',
                        'details': 'Missing X-Frame-Options header'
                    })
            except:
                pass
                
            return issues
        except Exception as e:
            print(f"Clickjacking check error: {str(e)}")
            return []

    def check_client_validation(self) -> List[Dict]:
        """Check for client-side validation bypasses"""
        try:
            issues = []
            
            # Test for client-side validation
            test_cases = [
                ('email', 'test@test.com<script>alert(1)</script>'),
                ('phone', '1234567890<script>alert(1)</script>'),
                ('name', '<script>alert(1)</script>')
            ]
            
            for field, value in test_cases:
                try:
                    response = requests.post(
                        urljoin(self.target, '/submit'),
                        data={field: value},
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'client_validation',
                            'description': 'Potential client-side validation bypass',
                            'details': f"Bypassed validation for field: {field}"
                        })
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Client validation check error: {str(e)}")
            return []

    def run(self) -> Dict:
        """Run all client-side vulnerability checks"""
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            xss_future = executor.submit(self.check_xss)
            csrf_future = executor.submit(self.check_csrf)
            clickjacking_future = executor.submit(self.check_clickjacking)
            validation_future = executor.submit(self.check_client_validation)
            
            self.results['xss'] = xss_future.result()
            self.results['csrf'] = csrf_future.result()
            self.results['clickjacking'] = clickjacking_future.result()
            self.results['client_validation'] = validation_future.result()
            
        return self.results 