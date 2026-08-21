import { pathToFileURL } from 'node:url';
const c = await import(pathToFileURL('./contracts/managed/ContractAuditor/contract/index.js').href);
console.log('Exports:', Object.keys(c));
console.log('Contract:', Object.keys(c.Contract));
if (c.circuits) console.log('Circuits:', Object.keys(c.circuits));
