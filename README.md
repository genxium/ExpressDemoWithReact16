# 1. Operating System

The backend part of this project is assumed to be running on Ubuntu 14.04 LTS.  

# 2. Database Server

The database product to be used for this project is MySQL 5.7.

We use [skeema](https://github.com/skeema/skeema) for schematic synchronization under `<proj-root>/database/skeema-repo-root/` which intentionally doesn't contain a `.skeema` file. Please read [this tutorial](https://shimo.im/doc/wQ0LvB0rlZcbHF5V) for more information.

With `skeema version 0.2` and `golang version 1.10`, it's tested to be compilable on `Windows10`, but NOT useful due to the failure of trial to communicate via `UNIX socket`.
```
powershell> skeema.exe --version
skeema version 0.2 (beta)

powershell> go version
go version go1.10 windows/amd64
```

You can use [this node module (still under development)](https://github.com/genxium/node-mysqldiff-bridge) instead under `Windows10`, other versions of Windows are not yet tested for compatibility.

The following command(s)
```
### Optional.
user@proj-root/database/skeema-repo-root> cp .skeema.template .skeema

###
user@proj-root/database/skeema-repo-root> skeema diff
```
is recommended to be used for checking difference from your "live MySQL server" to the latest expected schema tracked in git.

## 2.1 Environmental differentiation

Please note that we have 2 candidate live MySQL server configurations `<proj-root>/backend/configs/mysql.conf` and `<proj-root>/backend/configs/mysql.test.conf`, where the latter would only be used if `process.env.TESTING == "true"` for your NodeJs process(es) that runs the server.

# 3. What & How to Install

## 3.1 NodeJs Runtime

Please install `NodeJs 11.x` dependencies by [Ubuntu14InitScripts/backend/node/init](https://github.com/genxium/Ubuntu14InitScripts/tree/master/backend/node).

## 3.2 MySQL 

On a product machine, you can install and manage `MySQL` server by [these scripts](https://github.com/genxium/Ubuntu14InitScripts/tree/master/database/mysql) or alternatively use `<proj-root>/launch_databases_docker_container.sh`.

## 3.3 Node Modules

Please run

```
proj-root> npm install
proj-root/frontend> npm install
```

to complete the installation.

## 3.4 Required Config Files

Please make sure that the following config files 
```
- <proj-root>/backend/configs/mysql.test.conf, used by the api-server in non-production modes
- <proj-root>/backend/configs/mysql.conf, used by the api-server in production mode
- <proj-root>/backend/configs/qiniu.test.conf, used by the api-server in non-production modes
- <proj-root>/backend/configs/qiniu.conf, used by the api-server in `production` mode
```
exist and are properly set **before starting the backend daemons under ANY mode**.

Try

```
proj-root/backend> ./overwrite_configs 
```

or do it manually under `Windows10` (other versions of Windows are not yet tested). 


## 3.5 Upserting Admin Accounts

TBD.

## 3.6 How to Start & Stop Backend Daemon 
It's deliberately made that you need [pm2] installed for starting the necessary backend service of this repository, and you're recommended to have it installed globally on the OS.
```
root@shell> npm install pm2 -g
```

Start the backend service.
```
proj-root> pm2 start pm2.config.js --env <development | production> [--no-daemon]
```

## 3.7 How to Build Frontend Bundle(s)
Unlike the "modes" for backend daemon, there're by far only 2 modes for a frontend bundle
- development
- production

whilst each could be built with the following CLI procedure(s).

```
proj-root/frontend> npm run build-[development | production]
```
# Qiniu uphost list
## EastChina(Huadong) up.qiniu.com
## NorthChina(Huabei) up-z1.qiniu.com
## SouthChina(Huanan) up-z2.qiniu.com
## NorthAmerica up-na0.qiniu.com

# 4. Login flow for WebClient
Please refer to https://shimo.im/docs/IZ9QwHTMOTIZVfDG. 

