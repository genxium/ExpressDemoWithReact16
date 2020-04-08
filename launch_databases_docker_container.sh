#!/bin/bash

basedir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# docker pull mysql:5.7
# docker volume create shared_mysql_datadir
# Volume path reference https://github.com/docker-library/mysql/blob/master/5.7/Dockerfile.
# Can test by a mysql-client on the HostOS, e.g. "mysql --host <ip of HostOS> --port 3306 -uroot". 
mysqlContainerId=$(docker run -d -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p :3306:3306 --mount 'type=volume,src=shared_mysql_datadir,dst=/var/lib/mysql' mysql:5.7)

# docker pull mysql:8.0
# docker volume create shared_mysql8_datadir
# Volume path reference https://github.com/docker-library/mysql/blob/master/8.0/Dockerfile.
# Can test by a mysql-client on the HostOS, e.g. "mysql --host <ip of HostOS> --port 3306 -uroot". 
#mysqlContainerId=$(docker run -d -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p :3306:3306 --mount 'type=volume,src=shared_mysql8_datadir,dst=/var/lib/mysql' mysql:8.0)
