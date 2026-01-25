#!/bin/bash

echo "🔍 Comprehensive Pwnagotchi Connection Helper"
echo "=============================================="
echo ""

# Method 1: Try USB connection (most common for pwnagotchi)
echo "1️⃣  Trying USB connection (10.0.0.2)..."
if ping -c 1 -W 1000 10.0.0.2 > /dev/null 2>&1; then
    echo "   ✓ 10.0.0.2 is reachable!"
    echo "   Try: ssh pi@10.0.0.2"
    echo ""
    read -p "   Attempt connection now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ssh pi@10.0.0.2
        exit 0
    fi
else
    echo "   ✗ 10.0.0.2 not reachable"
fi
echo ""

# Method 2: Try mDNS names
echo "2️⃣  Trying mDNS discovery..."
for name in pwnagotchi.local raspberrypi.local pwnagotchi raspberrypi; do
    if ping -c 1 -W 1000 $name > /dev/null 2>&1; then
        IP=$(ping -c 1 $name 2>/dev/null | grep "bytes from" | awk '{print $4}' | tr -d ':')
        echo "   ✓ Found: $name -> $IP"
        echo "   Try: ssh pi@$IP"
        echo ""
        read -p "   Attempt connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ssh pi@$IP
            exit 0
        fi
        break
    fi
done
echo "   ✗ No mDNS names found"
echo ""

# Method 3: Scan current network for SSH
echo "3️⃣  Scanning local network for SSH servers..."
MY_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
if [ -z "$MY_IP" ]; then
    MY_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1)
fi

if [ ! -z "$MY_IP" ]; then
    NETWORK=$(echo $MY_IP | cut -d. -f1-3)
    echo "   Your IP: $MY_IP"
    echo "   Scanning $NETWORK.0/24 for SSH..."
    echo "   (This may take a minute...)"
    
    FOUND_IPS=()
    for i in {1..254}; do
        IP="$NETWORK.$i"
        if [ "$IP" != "$MY_IP" ]; then
            timeout 0.5 bash -c "echo > /dev/tcp/$IP/22" 2>/dev/null && FOUND_IPS+=($IP)
        fi
    done
    
    if [ ${#FOUND_IPS[@]} -gt 0 ]; then
        echo "   ✓ Found SSH servers at:"
        for ip in "${FOUND_IPS[@]}"; do
            echo "     - $ip"
        done
        echo ""
        echo "   Try connecting to each:"
        for ip in "${FOUND_IPS[@]}"; do
            echo "     ssh pi@$ip"
        done
    else
        echo "   ✗ No SSH servers found on network"
    fi
else
    echo "   ✗ Could not determine network"
fi
echo ""

# Method 4: Check web interface
echo "4️⃣  Checking for pwnagotchi web interface..."
for name in pwnagotchi.local 10.0.0.2; do
    if curl -s --connect-timeout 2 http://$name:8080 > /dev/null 2>&1; then
        echo "   ✓ Web UI found at: http://$name:8080"
        echo "   Open in browser to access pwnagotchi interface"
        break
    fi
done
echo ""

# Method 5: Router check
echo "5️⃣  Manual methods:"
echo "   - Check router admin: http://192.168.1.1"
echo "   - Look for device named 'pwnagotchi' or 'raspberrypi'"
echo "   - Check WiFi networks for 'pwnagotchi' (AP mode)"
echo ""

echo "💡 Tips:"
echo "   - Default username: pi"
echo "   - Default password: raspberry (or check pwnagotchi config)"
echo "   - USB connection usually uses 10.0.0.2"
echo "   - Web UI usually on port 8080"
echo ""
