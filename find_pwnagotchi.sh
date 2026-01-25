#!/bin/bash

# Script to find and connect to pwnagotchi

echo "🔍 Searching for pwnagotchi on network..."
echo ""

# List of IPs found on your network
IPS=(
  "192.168.1.151"
  "192.168.1.154"
  "192.168.1.156"
  "192.168.1.158"
  "192.168.1.159"
  "192.168.1.166"
  "192.168.1.171"
  "192.168.1.172"
  "192.168.1.177"
  "192.168.1.180"
  "192.168.1.181"
  "192.168.1.201"
  "192.168.1.6"
)

echo "Testing SSH access to devices..."
for ip in "${IPS[@]}"; do
  echo -n "Testing $ip... "
  if ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no -o BatchMode=yes pi@$ip exit 2>/dev/null; then
    echo "✓ SSH accessible!"
    echo "Try: ssh pi@$ip"
    break
  elif timeout 2 ssh -o ConnectTimeout=1 -o StrictHostKeyChecking=no pi@$ip "hostname" 2>&1 | grep -q "pwnagotchi\|raspberry"; then
    hostname=$(timeout 2 ssh -o ConnectTimeout=1 -o StrictHostKeyChecking=no pi@$ip "hostname" 2>&1 | grep -v "Warning\|timed out")
    echo "✓ Found: $hostname at $ip"
    echo "Try: ssh pi@$ip"
    break
  else
    echo "✗"
  fi
done

echo ""
echo "💡 If none found automatically, try connecting manually:"
echo "   ssh pi@<IP_ADDRESS>"
echo ""
echo "Default credentials are usually:"
echo "   Username: pi"
echo "   Password: raspberry (or check pwnagotchi docs)"
