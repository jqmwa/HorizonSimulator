# USB Connection Troubleshooting for Pwnagotchi

## Issue: RNDIS/Ethernet Gadget Shows "Not Connected"

Even though the USB device appears in Network settings, the network interface isn't connecting. This could be:

### Possible Causes:

1. **Bad USB Cable**
   - Cable might only provide power, not data
   - Try a different USB cable (data-capable, not charge-only)
   - Try a different USB port

2. **USB Port Issue**
   - Try a different USB port on your Mac
   - Some ports might be power-only
   - USB 3.0 ports usually work better

3. **Pwnagotchi Not in USB Mode**
   - Pwnagotchi might need to be configured for USB networking
   - Check pwnagotchi config file (usually `/etc/pwnagotchi/config.toml`)
   - USB mode might need to be enabled

4. **macOS Driver/Recognition Issue**
   - macOS might detect the device but not activate the network
   - Try disconnecting and reconnecting
   - Restart Network settings

## Troubleshooting Steps:

### Step 1: Test USB Cable
```bash
# Try a different USB cable
# Make sure it's a data cable, not charge-only
```

### Step 2: Try Different USB Port
- Unplug from current port
- Try a different USB port (especially USB 3.0 if available)
- Wait 10 seconds, check if RNDIS appears and connects

### Step 3: Reset Network Interface
1. In Network settings, select "RNDIS/Ethernet Gadget"
2. Click "Make Inactive" (if available)
3. Wait 5 seconds
4. Click to make it active again
5. Or click "Details" and try to connect/configure

### Step 4: Check Pwnagotchi Status
- Is the pwnagotchi screen showing it's running?
- Are there any error messages on the pwnagotchi display?
- Does the pwnagotchi need to be in a specific mode for USB networking?

### Step 5: Manual Configuration
In Network settings → Details:
- Try setting IPv4 to "Manually"
- IP: `10.0.0.1`
- Subnet: `255.255.255.0`
- Apply and wait

### Step 6: Check System Logs
```bash
# Check for USB/network errors
log show --predicate 'process == "configd"' --last 5m | grep -i "rndis\|usb\|ethernet"
```

## Alternative: Use WiFi Instead
If USB continues to be problematic:
- Connect pwnagotchi to your WiFi network
- Find its IP via router admin page
- SSH via WiFi instead of USB

## Quick Test
After making changes, test connection:
```bash
ping -c 3 10.0.0.2
# If ping works, then try:
ssh pi@10.0.0.2
```
