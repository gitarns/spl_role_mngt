#!/bin/env python


import sys
import os
import logging
import json
import splunk
from splunk.appserver.mrsparkle.lib.util import make_splunkhome_path
sys.path.append('/usr/lib64/python2.7/site-packages/')
import ldap


def setup_logger(level):
    """
    Setup a logger for the REST handler
    """

    logger = logging.getLogger('splunk.appserver.getldapuserhandler')
    logger.propagate = False # Prevent the log messages from being duplicated in the python.log file
    logger.setLevel(level)

    log_file_path = make_splunkhome_path(['var', 'log', 'splunk', 'ldap_search_rest_handler.log'])
    file_handler = logging.handlers.RotatingFileHandler(log_file_path, maxBytes=25000000,
                                                        backupCount=5)

    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger

logger = setup_logger(logging.DEBUG)


class GetLdapUserHandler(splunk.rest.BaseRestHandler):
    
	def handle_GET(self):
		logger.info("request: %s ",self.request)
		queried_user = self.request['query']['query']
		try:
			l = ldap.open("192.168.1.200")
			l.protocol_version = ldap.VERSION3	
		except ldap.LDAPError, e:
			logger.info("ldap connection: %s ",e)
			return {
			'payload': 'Error in ldap connection', # Payload of the request.
			'status': 500 # HTTP status code
			}

		baseDN = "ou=people, dc=sanrall, dc=local"
		searchScope = ldap.SCOPE_SUBTREE
		retrieveAttributes = ['uid','homeDirectory']
		searchFilter = "cn="+queried_user
		ldap_response = []

		try:
			l.simple_bind('cn=admin,dc=sanrall,dc=local','zappamaster')
			ldap_result_id = l.search(baseDN, searchScope, searchFilter, retrieveAttributes)
			result_set = []
			while 1:
				result_type, result_data = l.result(ldap_result_id, 0)
				if (result_data == []):
					break
				else:
					## here you don't have to append to a list
					## you could do whatever you want with the individual entry
					## The appending to list is just for illustration. 
					if result_type == ldap.RES_SEARCH_ENTRY:
						id = 0
						for dn, attrs in result_data:
							user = {}
							user['id'] = id
							user['text'] = attrs['uid'][0]
							user['idrh'] = attrs['uid'][0]
							user['path'] = attrs['homeDirectory'][0]
							ldap_response.append(user)
							id = id + 1
			select2 = {}
			select2['results'] = ldap_response
			logger.info("ldap response: %s ",json.dumps(select2))
			self.response.setStatus(200)
			self.response.write(json.dumps(select2))
			
		except ldap.LDAPError, e:
			logger.info("ldap search error: %s ",e)
			self.response.setStatus(500)
			self.response.write(e)
			

	handle_POST = handle_GET