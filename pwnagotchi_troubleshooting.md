# Pwnagotchi Connection Troubleshooting

## Current Status
- SSH to 10.0.0.2: **Operation timed out**
- SSH to 192.168.1.x IPs: **No route to host**

## Possible Issues & Solutions

### 1. USB Connection Not Established
**Problem:** Pwnagotchi connected via USB but network interface not active

**Solutions:**
- Unplug and replug the USB cable
- Check if USB network interface appears: `ifconfig | grep -i usb`
- On macOS, you may need to enable "Internet Sharing" or trust the USB network
- Try different USB port

### 2. Pwnagotchi in AP (Access Point) Mode
**Problem:** Pwnagotchi is broadcasting its own WiFi network

**Solution:**
- Check WiFi networks for one named "pwnagotchi" or similar
- Connect to that network
- Then try: `ssh pi@10.0.0.2` or check the web UI

### 3. SSH Not Enabled
**Problem:** SSH service might be disabled on pwnagotchi

**Solutions:**
- Access via web UI first: `http://10.0.0.2:8080` or `http://pwnagotchi.local:8080`
- Enable SSH through the web interface
- Or access via serial/USB console if available

### 4. Different IP Address
**Problem:** Pwnagotchi might have a different IP

**Solutions:**
- Check router admin page (http://192.168.1.1) for connected devices
- Look for device named "pwnagotchi" or "raspberrypi"
- Try mDNS: `ssh pi@pwnagotchi.local` or `ssh pi@raspberrypi.local`

### 5. Firewall or Network Issues
**Problem:** Network blocking the connection

**Solutions:**
- Check macOS firewall settings
- Try disabling firewall temporarily
- Check if other devices can connect

## Quick Commands to Try

```bash
# Try mDNS
ssh pi@pwnagotchi.local
ssh pi@raspberrypi.local

# Try web interface
open http://pwnagotchi.local:8080
open http://10.0.0.2:8080

# Check USB network
ifconfig | grep -i usb
ifconfig | grep "10.0.0"

# Scan for SSH
nmap -p 22 10.0.0.0/24  # if nmap installed
```

## Next Steps

1. **Check physical connection:** Is the pwnagotchi powered on? Is USB cable connected?
2. **Check WiFi:** Is there a "pwnagotchi" WiFi network available?
3. **Check router:** Look at router admin page for connected devices
4. **Try web UI:** Open browser to http://pwnagotchi.local:8080
