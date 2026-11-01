/**
 * Network Model Factory
 */
import { NetworkModel } from './network-model.js';

export function createNetworkModel(props) {
  return new NetworkModel(props);
}

