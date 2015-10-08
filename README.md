# locks

Locks is a virtual machine traffic control server for SauceLabs users. It ensures a test is never waiting to acquire a virtual machine. This allows orchestration software to avoid killing tests early for reasons unrelated to failure (i.e. a test should never be punished for running too long if it was merely waiting for a VM to become available).

Coming soon: 
  * Remote API + installation instructions.
  * Prioritization ("skip the line")
  * Automatic worker count suggestions
