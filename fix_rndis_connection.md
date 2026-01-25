# Fix RNDIS/Ethernet Gadget Connection

## Problem
The RNDIS/Ethernet Gadget shows "Not connected" in macOS Network settings, which prevents SSH access to pwnagotchi via USB.

## Solution Steps

### Step 1: Open Details
1. In the Network settings window, click the **"Details..."** button
2. Or click directly on "RNDIS/Ethernet Gadget" to select it

### Step 2: Activate the Connection
1. Make sure the service is **Active** (not "Make Inactive")
2. If it says "Make Inactive", the connection is already active
3. If there's a way to "Connect" or enable it, do that

### Step 3: Configure Network Settings
1. In the Details/Configuration panel:
   - **Configure IPv4:** Set to "Using DHCP" (recommended) or "Manually"
   
2. **If using Manual configuration:**
   - **IP Address:** `10.0.0.1`
   - **Subnet Mask:** `255.255.255.0`
   - **Router:** Leave blank or `10.0.0.2`

### Step 4: Apply and Test
1. Click **"Apply"** or **"OK"** to save settings
2. Wait 10-15 seconds for the connection to establish
3. Check that the status changes from "Not connected" to "Connected" (green dot)

### Step 5: Connect via SSH
Once connected, try:
```bash
ssh pi@10.0.0.2
```

Default password is usually: `raspberry`

## Alternative: System Preferences Method
If the above doesn't work:
1. Go to **System Settings** → **Network**
2. Find "RNDIS/Ethernet Gadget" in the list
3. Click the **info (i)** icon or double-click it
4. Configure as above
5. Make sure it's enabled/connected

## Troubleshooting
- **Still not connecting?** Try unplugging and replugging the USB cable
- **No RNDIS device appears?** The pwnagotchi might need to be in USB mode (check its configuration)
- **Permission issues?** You may need to allow the network connection in System Settings
