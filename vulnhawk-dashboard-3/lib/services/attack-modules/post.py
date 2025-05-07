import requests
from typing import Dict, List
import concurrent.futures
from urllib.parse import urljoin
import re

class PostModule:
    def __init__(self, target: str):
        self.target = target
        self.results = {
            "data_exfiltration": [],
            "lateral_movement": [],
            "persistence": [],
            "impact_assessment": []
        }
        
    def check_data_exfiltration(self) -> List[Dict]:
        """Check for data exfiltration paths"""
        try:
            issues = []
            
            # Check for data export endpoints
            export_paths = [
                '/api/export',
                '/api/download',
                '/api/data',
                '/api/backup'
            ]
            
            for path in export_paths:
                try:
                    response = requests.get(
                        urljoin(self.target, path),
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'data_exfiltration',
                            'description': 'Potential data exfiltration path',
                            'details': f"Accessible export endpoint: {path}"
                        })
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Data exfiltration check error: {str(e)}")
            return []

    def check_lateral_movement(self) -> List[Dict]:
        """Check for lateral movement possibilities"""
        try:
            issues = []
            
            # Check for internal network access
            internal_paths = [
                '/api/internal',
                '/admin/internal',
                '/internal',
                '/network'
            ]
            
            for path in internal_paths:
                try:
                    response = requests.get(
                        urljoin(self.target, path),
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'lateral_movement',
                            'description': 'Potential lateral movement path',
                            'details': f"Accessible internal endpoint: {path}"
                        })
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Lateral movement check error: {str(e)}")
            return []

    def check_persistence(self) -> List[Dict]:
        """Check for persistence mechanisms"""
        try:
            issues = []
            
            # Check for persistence mechanisms
            persistence_paths = [
                '/api/cron',
                '/api/scheduled',
                '/api/tasks',
                '/admin/settings'
            ]
            
            for path in persistence_paths:
                try:
                    response = requests.get(
                        urljoin(self.target, path),
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'persistence',
                            'description': 'Potential persistence mechanism',
                            'details': f"Accessible persistence endpoint: {path}"
                        })
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Persistence check error: {str(e)}")
            return []

    def assess_impact(self) -> List[Dict]:
        """Assess potential impact of successful exploits"""
        try:
            issues = []
            
            # Check for sensitive operations
            sensitive_paths = [
                ('/api/users', 'User management'),
                ('/api/data', 'Data access'),
                ('/api/settings', 'System settings'),
                ('/api/admin', 'Admin functions')
            ]
            
            for path, description in sensitive_paths:
                try:
                    response = requests.get(
                        urljoin(self.target, path),
                        timeout=5
                    )
                    if response.status_code == 200:
                        issues.append({
                            'type': 'impact_assessment',
                            'description': 'Potential high-impact access',
                            'details': f"Accessible {description} endpoint: {path}"
                        })
                except:
                    continue
                    
            return issues
        except Exception as e:
            print(f"Impact assessment error: {str(e)}")
            return []

    def run(self) -> Dict:
        """Run all post-exploitation checks"""
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            exfiltration_future = executor.submit(self.check_data_exfiltration)
            lateral_future = executor.submit(self.check_lateral_movement)
            persistence_future = executor.submit(self.check_persistence)
            impact_future = executor.submit(self.assess_impact)
            
            self.results['data_exfiltration'] = exfiltration_future.result()
            self.results['lateral_movement'] = lateral_future.result()
            self.results['persistence'] = persistence_future.result()
            self.results['impact_assessment'] = impact_future.result()
            
        return self.results 