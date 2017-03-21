# Locks

Locks is a virtual machine traffic control service for SauceLabs users. 

It ensures a test is never waiting to acquire a virtual machine. This allows orchestration software to avoid killing tests early for reasons unrelated to failure (i.e. a test should never be punished for running too long if it was merely waiting for a VM to become available).

Coming soon: 
  * Remote API + installation instructions.
  * Prioritization ("skip the line")
  * Automatic worker count suggestions



# Startup

```
export SAUCE_ACCESS_KEY='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
export SAUCE_USERNAME='xxxxxxxxxxxx'

# optionally configure statsd
export LOCKS_STATSD_URL=hostname.of.statsd.server.com
export LOCKS_STATSD_PREFIX=locks

forever start /path/to/locks/src/server.js
```

## Using Docker

```
# docker build . -t testarmada/locks

# docker run -e SAUCE_ACCESS_KEY='YOUR_KEY' \
-e SAUCE_USERNAME='YOUR_USER' \
--restart=always \
--publish=4765:4765 \
--detach=true \
--name=locks \
-d testarmada/locks
```
