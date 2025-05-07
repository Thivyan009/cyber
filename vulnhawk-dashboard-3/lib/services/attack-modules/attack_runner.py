import sys
import json
import os
import traceback
from typing import Dict, List, Any

def setup_logging():
    """Configure logging to both stderr and a file"""
    import logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        stream=sys.stderr
    )
    return logging.getLogger('attack_runner')

logger = setup_logging()

class AttackRunner:
    def __init__(self, target: str, modules: List[str]):
        self.target = target
        self.modules = modules
        self.results: Dict[str, Any] = {}
        logger.info(f"Initialized AttackRunner with target: {target}, modules: {modules}")
        
    def run_module(self, module_name: str) -> Dict:
        """Run a specific attack module"""
        try:
            logger.info(f"Starting module: {module_name}")
            
            # Import the module dynamically
            try:
                if module_name == 'recon':
                    from recon import ReconModule as Module
                elif module_name == 'auth':
                    from auth import AuthModule as Module
                elif module_name == 'client':
                    from client import ClientModule as Module
                elif module_name == 'file':
                    from file import FileModule as Module
                elif module_name == 'post':
                    from post import PostModule as Module
                else:
                    raise ImportError(f'Unknown module: {module_name}')
            except ImportError as e:
                logger.error(f"Failed to import module {module_name}: {e}")
                return {'error': f'Module import failed: {str(e)}'}
                
            # Initialize and run the module
            try:
                module = Module(self.target)
                result = module.run()
                logger.info(f"Module {module_name} completed successfully")
                return result
            except Exception as e:
                logger.error(f"Error running module {module_name}: {e}")
                logger.error(traceback.format_exc())
                return {'error': str(e)}
                
        except Exception as e:
            logger.error(f"Unexpected error in run_module: {e}")
            logger.error(traceback.format_exc())
            return {'error': str(e)}
            
    def run(self) -> Dict:
        """Run all selected attack modules"""
        try:
            logger.info("Starting attack run")
            for module in self.modules:
                logger.info(f"Running module: {module}")
                self.results[module] = self.run_module(module)
                logger.info(f"Completed module: {module}")
            
            logger.info("Attack run completed")
            return self.results
        except Exception as e:
            logger.error(f"Error in run: {e}")
            logger.error(traceback.format_exc())
            return {'error': str(e)}

def main():
    try:
        logger.info(f"Starting main with args: {sys.argv}")
        
        if len(sys.argv) < 3:
            logger.error("Insufficient arguments")
            print("Usage: python attack_runner.py <target> <module1> [module2 ...]")
            sys.exit(1)
            
        target = sys.argv[1]
        modules = sys.argv[2:]
        
        logger.info(f"Running attack on {target} with modules: {modules}")
        runner = AttackRunner(target, modules)
        results = runner.run()
        
        # Output results as JSON
        output = json.dumps(results)
        logger.info("Successfully serialized results to JSON")
        print(output)
        
        logger.info("Attack completed successfully")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error in main: {e}")
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main() 