import { StateValue } from '@midnight-ntwrk/compact-runtime';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';

class DummyPrivateStateProvider implements PrivateStateProvider<any> {
  async get(id: string) {
    return StateValue.newNull();
  }
  async set(id: string, state: any, version?: any) {
    return StateValue.newNull();
  }
  async clear(id: string) {}
  async setContractAddress(id: string, address: string) {}
}

console.log("Compiles fine!");
