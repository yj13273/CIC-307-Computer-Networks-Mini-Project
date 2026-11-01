/**
 * Cisco IOS Access Control List (ACL) Generator
 */

export function generateAclConfig(profileId, subnets = []) {
  const lines = [
    `! --- Extended Access Control Lists (ACLs) ---`
  ];

  if (profileId === 'campus-lan') {
    const studentSub = subnets.find(s => s.vlanId === 10) || { networkAddress: '10.10.0.0', wildcardMask: '0.0.3.255' };
    const facultySub = subnets.find(s => s.vlanId === 20) || { networkAddress: '10.10.4.0', wildcardMask: '0.0.1.255' };
    const mgmtSub = subnets.find(s => s.vlanId === 99) || { networkAddress: '10.10.8.0', wildcardMask: '0.0.0.63' };

    lines.push(`ip access-list extended ACL-STUDENT-ISOLATION`);
    lines.push(` remark Block student wireless from accessing faculty administrative subnet`);
    lines.push(` deny ip ${studentSub.networkAddress} ${studentSub.wildcardMask} ${facultySub.networkAddress} ${facultySub.wildcardMask}`);
    lines.push(` remark Block student wireless from accessing network management infrastructure`);
    lines.push(` deny ip ${studentSub.networkAddress} ${studentSub.wildcardMask} ${mgmtSub.networkAddress} ${mgmtSub.wildcardMask}`);
    lines.push(` remark Permit DHCP and DNS traffic`);
    lines.push(` permit udp ${studentSub.networkAddress} ${studentSub.wildcardMask} any eq bootps`);
    lines.push(` permit udp ${studentSub.networkAddress} ${studentSub.wildcardMask} any eq domain`);
    lines.push(` remark Permit all outbound general internet traffic`);
    lines.push(` permit ip ${studentSub.networkAddress} ${studentSub.wildcardMask} any`);
    lines.push(`!`);
    lines.push(`ip access-list extended ACL-MGMT-PROTECT`);
    lines.push(` remark Allow SSH only from authorized management workstations`);
    lines.push(` permit tcp ${mgmtSub.networkAddress} ${mgmtSub.wildcardMask} any eq 22`);
    lines.push(` deny tcp any any eq 22 log`);
    lines.push(` permit ip any any`);
    lines.push(`!`);
  } else if (profileId === 'metro-man') {
    lines.push(`ip access-list extended ACL-FINTECH-EDGE-PROTECT`);
    lines.push(` remark Enforce low-latency trading feed whitelisting`);
    lines.push(` permit tcp 172.16.0.0 0.0.0.255 any range 443 8443`);
    lines.push(` permit udp 172.16.0.0 0.0.0.255 any range 50000 51000`);
    lines.push(` deny ip any any log`);
    lines.push(`!`);
  } else {
    // Global WAN
    const iotSub = subnets.find(s => s.role === 'iot-fleet') || { networkAddress: '10.0.0.0', wildcardMask: '0.0.7.255' };
    lines.push(`ip access-list extended ACL-IOT-FLEET-QUARANTINE`);
    lines.push(` remark Prevent IoT warehouse scanners from accessing corporate internal servers`);
    lines.push(` deny ip ${iotSub.networkAddress} ${iotSub.wildcardMask} 10.0.8.0 0.0.3.255`);
    lines.push(` remark Permit telemetry ingestion to cloud gateway only`);
    lines.push(` permit tcp ${iotSub.networkAddress} ${iotSub.wildcardMask} 10.0.12.0 0.0.0.255 eq 8883`);
    lines.push(` permit udp ${iotSub.networkAddress} ${iotSub.wildcardMask} any eq domain`);
    lines.push(` deny ip ${iotSub.networkAddress} ${iotSub.wildcardMask} any log`);
    lines.push(`!`);
  }

  return lines.join('\n');
}

