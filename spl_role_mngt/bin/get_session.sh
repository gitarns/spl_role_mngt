#!/bin/bash

STDIN=$(cat -)
echo $STDIN > /tmp/session.txt
exit 0
