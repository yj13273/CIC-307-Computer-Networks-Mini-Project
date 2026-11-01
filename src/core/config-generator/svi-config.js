/**
 * Cisco IOS SVI (Switch Virtual Interface) Configuration Generator
 */

export function generateSviConfig(subnets = [], standbyGroup = 1) {
  const lines = [
    `! --- Layer 3 Switch Virtual Interfaces (SVIs) ---`
  ];

  for (const sub of subnets) {
    if (!sub.vlanId) continue;
    lines.push(`interface Vlan${sub.vlanId}`);
    lines.push(` description SVI Gateway for ${sub.name}`);
    lines.push(` ip address ${sub.defaultGateway} ${sub.netmask}`);
    // HSRP First-Hop Redundancy
    lines.push(` standby version 2`);
    lines.push(` standby ${sub.vlanId} ip ${sub.defaultGateway}`);
    lines.push(` standby ${sub.vlanId} priority 110`);
    lines.push(` standby ${sub.vlanId} preempt`);
    lines.push(` no shutdown`);
    lines.push(`!`);
  }

  return lines.join('\n');
}

