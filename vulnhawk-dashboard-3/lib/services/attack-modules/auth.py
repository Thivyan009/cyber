import requests
from typing import Dict, List
import concurrent.futures
from urllib.parse import urljoin

class AuthModule:
    def __init__(self, target: str):
        self.target = target
        self.results = {
            "weak_auth": [],
            "session_issues": [],
            "brute_force": [],
            "auth_bypass": []
        }
        
    def check_weak_auth(self) -> List[Dict]:
        """Check for weak authentication mechanisms"""
        try:
            issues = []
            
            # Check for default credentials
            default_creds = [
                ('admin', 'admin'),
                ('admin', 'password'),
                ('root', 'root'),
                ('user', 'password')
            ]
            
            for username, password in default_creds:
                try:
                    response = requests.post(
                        urljoin(self.target, '/login'),
                        data={'username': username, 'password': password},
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'weak_auth',
                            'description': 'Default credentials found',
                            'details': f"Username: {username}, Password: {password}"
                        })
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Weak auth check error: {str(e)}")
            return []

    def check_session_management(self) -> List[Dict]:
        """Check for session management issues"""
        try:
            issues = []
            
            # Check for session fixation
            try:
                response = requests.get(self.target)
                if 'Set-Cookie' in response.headers:
                    cookie = response.headers['Set-Cookie']
                    if 'httponly' not in cookie.lower():
                        issues.append({
                            'type': 'session_issue',
                            'description': 'Missing HttpOnly flag',
                            'details': 'Session cookie is accessible via JavaScript'
                        })
                    if 'secure' not in cookie.lower():
                        issues.append({
                            'type': 'session_issue',
                            'description': 'Missing Secure flag',
                            'details': 'Session cookie can be sent over non-HTTPS'
                        })
            except:
                pass
                
            return issues
        except Exception as e:
            print(f"Session management check error: {str(e)}")
            return []

    def test_brute_force(self) -> List[Dict]:
        """Test for brute force vulnerabilities"""
        try:
            issues = []
            
            # Test for rate limiting
            for _ in range(10):
                try:
                    response = requests.post(
                        urljoin(self.target, '/login'),
                        data={'username': 'test', 'password': 'wrong'},
                        timeout=5
                    )
                    if response.status_code != 429:  # No rate limiting
                        issues.append({
                            'type': 'brute_force',
                            'description': 'No rate limiting detected',
                            'details': 'Multiple failed login attempts allowed'
                        })
                        break
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Brute force test error: {str(e)}")
            return []

    def check_auth_bypass(self) -> List[Dict]:
        """Check for authentication bypass techniques"""
        try:
            issues = []
            
            # Test for path traversal in auth endpoints
            paths = [
                '/admin',
                '/dashboard',
                '/user/profile',
                '/api/user'
            ]
            
            for path in paths:
                try:
                    response = requests.get(
                        urljoin(self.target, path),
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'auth_bypass',
                            'description': 'Potential authentication bypass',
                            'details': f"Accessible path: {path}"
                        })
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Auth bypass check error: {str(e)}")
            return []

    def run(self) -> Dict:
        """Run all authentication checks"""
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            weak_auth_future = executor.submit(self.check_weak_auth)
            session_future = executor.submit(self.check_session_management)
            brute_force_future = executor.submit(self.test_brute_force)
            bypass_future = executor.submit(self.check_auth_bypass)
            
            self.results['weak_auth'] = weak_auth_future.result()
            self.results['session_issues'] = session_future.result()
            self.results['brute_force'] = brute_force_future.result()
            self.results['auth_bypass'] = bypass_future.result()
            
        return self.results 