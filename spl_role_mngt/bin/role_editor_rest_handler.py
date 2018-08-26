import logging
import csv
import json
import time
import datetime

from splunk.appserver.mrsparkle.lib.util import make_splunkhome_path
from splunk import AuthorizationFailed, ResourceNotFound
from splunk.rest import simpleRequest

# The default of the csv module is 128KB; upping to 10MB. See SPL-12117 for
# the background on issues surrounding field sizes.
# (this method is new in python 2.5)
csv.field_size_limit(10485760)

def setup_logger(level):
    """
    Setup a logger for the REST handler
    """

    logger = logging.getLogger('splunk.appserver.role_editor.rest_handler')
    logger.propagate = False # Prevent the log messages from being duplicated in the python.log file
    logger.setLevel(level)

    log_file_path = make_splunkhome_path(['var', 'log', 'splunk', 'role_editor_rest_handler.log'])
    file_handler = logging.handlers.RotatingFileHandler(log_file_path, maxBytes=25000000,
                                                        backupCount=5)

    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger

logger = setup_logger(logging.DEBUG)

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


