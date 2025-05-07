import requests
from typing import Dict, List
import concurrent.futures
from urllib.parse import urljoin
import re

class FileModule:
    def __init__(self, target: str):
        self.target = target
        self.results = {
            "sql_injection": [],
            "nosql_injection": [],
            "command_injection": [],
            "file_upload": [],
            "data_leakage": []
        }
        
    def check_sql_injection(self) -> List[Dict]:
        """Check for SQL injection vulnerabilities"""
        try:
            issues = []
            
            # SQL injection payloads
            sql_payloads = [
                "' OR '1'='1",
                "' OR 1=1--",
                "' UNION SELECT NULL--",
                "admin'--"
            ]
            
            # Test common parameters
            params = ['id', 'user', 'name', 'search']
            
            for param in params:
                for payload in sql_payloads:
                    try:
                        response = requests.get(
                            urljoin(self.target, f'/?{param}={payload}'),
                            timeout=5
                        )
                        if any(error in response.text.lower() for error in ['sql', 'mysql', 'postgresql', 'oracle']):
                            issues.append({
                                'type': 'sql_injection',
                                'description': 'Potential SQL injection vulnerability',
                                'details': f"SQL error in parameter: {param}"
                            })
                            break
                    except:
                        continue
                        
            return issues
        except Exception as e:
            print(f"SQL injection check error: {str(e)}")
            return []

    def check_nosql_injection(self) -> List[Dict]:
        """Check for NoSQL injection vulnerabilities"""
        try:
            issues = []
            
            # NoSQL injection payloads
            nosql_payloads = [
                '{"$gt": ""}',
                '{"$ne": null}',
                '{"$where": "1==1"}'
            ]
            
            for payload in nosql_payloads:
                try:
                    response = requests.post(
                        urljoin(self.target, '/api/search'),
                        json={'query': payload},
                        timeout=5
                    )
                    if response.status_code == 200 and len(response.json()) > 0:
                        issues.append({
                            'type': 'nosql_injection',
                            'description': 'Potential NoSQL injection vulnerability',
                            'details': 'NoSQL query manipulation successful'
                        })
                        break
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"NoSQL injection check error: {str(e)}")
            return []

    def check_command_injection(self) -> List[Dict]:
        """Check for command injection vulnerabilities"""
        try:
            issues = []
            
            # Command injection payloads
            cmd_payloads = [
                '; ls',
                '& dir',
                '| cat /etc/passwd',
                '`id`'
            ]
            
            for payload in cmd_payloads:
                try:
                    response = requests.get(
                        urljoin(self.target, f'/api/execute?cmd={payload}'),
                        timeout=5
                    )
                    if any(output in response.text for output in ['root:', '/bin/bash', 'uid=']):
                        issues.append({
                            'type': 'command_injection',
                            'description': 'Potential command injection vulnerability',
                            'details': 'Command execution successful'
                        })
                        break
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Command injection check error: {str(e)}")
            return []

    def check_file_upload(self) -> List[Dict]:
        """Check for insecure file upload vulnerabilities"""
        try:
            issues = []
            
            # Test file upload
            test_files = [
                ('test.php', '<?php echo "test"; ?>', 'application/x-php'),
                ('test.jsp', '<% out.println("test"); %>', 'application/jsp'),
                ('test.asp', '<% Response.Write("test") %>', 'application/asp')
            ]
            
            for filename, content, content_type in test_files:
                try:
                    files = {'file': (filename, content, content_type)}
                    response = requests.post(
                        urljoin(self.target, '/upload'),
                        files=files,
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'file_upload',
                            'description': 'Potential insecure file upload',
                            'details': f"Uploaded file: {filename}"
                        })
                        break
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"File upload check error: {str(e)}")
            return []

    def check_data_leakage(self) -> List[Dict]:
        """Check for sensitive data leakage"""
        try:
            issues = []
            
            # Check for sensitive files
            sensitive_paths = [
                '/.git/config',
                '/.env',
                '/config.php',
                '/backup.zip',
                '/database.sql'
            ]
            
            for path in sensitive_paths:
                try:
                    response = requests.get(
                        urljoin(self.target, path),
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'data_leakage',
                            'description': 'Potential sensitive data leakage',
                            'details': f"Accessible sensitive file: {path}"
                        })
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Data leakage check error: {str(e)}")
            return []

    def run(self) -> Dict:
        """Run all file and data exploit checks"""
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            sql_future = executor.submit(self.check_sql_injection)
            nosql_future = executor.submit(self.check_nosql_injection)
            cmd_future = executor.submit(self.check_command_injection)
            upload_future = executor.submit(self.check_file_upload)
            leakage_future = executor.submit(self.check_data_leakage)
            
            self.results['sql_injection'] = sql_future.result()
            self.results['nosql_injection'] = nosql_future.result()
            self.results['command_injection'] = cmd_future.result()
            self.results['file_upload'] = upload_future.result()
            self.results['data_leakage'] = leakage_future.result()
            
        return self.results 