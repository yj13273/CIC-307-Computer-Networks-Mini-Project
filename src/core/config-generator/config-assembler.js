/**
 * Configuration Assembler
 * Assembles and formats device configurations for the entire network
 */
import { generateSwitchConfig } from './switch-config.js';
import { generateRouterConfig } from './router-config.js';
import { generateSviConfig } from './svi-config.js';
import { generateAclConfig } from './acl-config.js';

export function assembleConfigurations(model, vlsmResult) {
  const configs = [];
  const profileId = model.profileId;
  const subnets = vlsmResult.allocations || [];

  for (const device of model.devices || []) {
    let configContent = '';
    const isSwitch = device.role.includes('switch');
    const isRouter = device.role.includes('router') || device.role.includes('gateway');

    if (isSwitch) {
      const isCore = device.role === 'core-switch';
      const switchConfig = generateSwitchConfig({
        hostname: device.name,
        model: device.platform || 'Catalyst 9300',
        vlans: subnets.map(s => ({ vlanId: s.vlanId, name: s.name })),
        trunks: [
          { port: 'TenGigabitEthernet1/1/1', remoteDevice: 'Core / Distribution Backbone' },
          { port: 'TenGigabitEthernet1/1/2', remoteDevice: 'Redundant Uplink' }
        ],
        accessPorts: [
          { range: 'GigabitEthernet1/0/1 - 24', description: 'User Endpoints', vlanId: subnets[0]?.vlanId || 10 },
          { range: 'GigabitEthernet1/0/25 - 48', description: 'PoE APs & Workstations', vlanId: subnets[1]?.vlanId || 20 }
        ],
        poeEnabled: true,
        rapidPvst: true
      });

      let extra = '';
      if (isCore) {
        // Add SVIs and ACLs to core switch
        extra = '\n' + generateSviConfig(subnets) + '\n' + generateAclConfig(profileId, subnets);
      }

      configContent = switchConfig + extra;
    } else if (isRouter) {
      const isWan = profileId === 'global-wan';
      configContent = generateRouterConfig({
        hostname: device.name,
        model: device.platform || 'ISR 4451-X',
        profileId,
        subnets,
        routing: model.routing,
        bgpPeering: isWan ? { enterpriseAsn: 65000, cloudAsn: 64512 } : null,
        ipsecEnabled: profileId === 'global-wan' || profileId === 'metro-man'
      });

      // Append ACL
      configContent += '\n' + generateAclConfig(profileId, subnets);
    } else {
      configContent = `! Configuration for ${device.name}\nhostname ${device.name}\n!\nend\n`;
    }

    configs.push({
      deviceId: device.id,
      deviceName: device.name,
      role: device.role,
      platform: device.platform || 'Cisco IOS-XE',
      filename: `${device.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.cfg`,
      content: configContent
    });
  }

  return configs;
}

