# locks

Note: this is a work in progress

#### Problem

```
  -> client1 asks for a VM
  -> client2 asks for a VM
  -> ping
    <-- active: 99    (we have one VM left available)
  -> client1 is given a VM
  -> local count incremented to 100 as a result
  -> ping
    <-- active: 99    (client1 has not yet claimed the VM because it's taking a while to set up a tunnel or boot up the test)
  -> local count updated to 99 as a result
  -> client2 is given a VM (we have one VM available)
  -> 100th VM is now over-booked. One of the jobs might fail due to a bailout time.
```

#### Solution?

```
  -> client1 asks for a VM
  -> client2 asks for a VM
  -> ping
      active: 99    (we have one VM available)
  -> client1 is given a VM
  -> push a timestamp to local claims array which will expire in 2 minutes. The "real" count provider-side is always summed with the length of this array.
  -> ping
      active: 99 + 1 local claim
      Note: client1 has not yet claimed the VM because it's taking a while to set up a tunnel or boot up the test,
            but we don't expire its claim for another minute and 55 seconds or so.
```

- Continuously ping provider for VM usage information. 
- Keep own representation of available counts
- Handle worker traffic control requests:
  - If VMs are available, grant them to a worker and increase our local claim count.
  - If VMs are not available, tell the requesting worker nothing is available. The worker will ping again later.
  - New worker VM requests get queued and have to wait until a new ping comes in indicating room. 
  - A VM is only handed out after the NEXT usage ping's data comes in (hopefully allows for queueing of previous pings to take effect)

- We fetch pings, and then actions taken since the last ping (like handing out of VMs) increment local counts. We can thus only
  hand out a new VM after a ping indicates our usage has *fallen*. This is done by expiring local counts after some reasonable amount of time. This prevents us from accidentally overprovisioning the virtual machines.
