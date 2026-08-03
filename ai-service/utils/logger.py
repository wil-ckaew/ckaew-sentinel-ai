import logging
import sys

def setup_logger():
    """Configura o logger da aplicação"""
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    
    # Handler para console
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    return logger
