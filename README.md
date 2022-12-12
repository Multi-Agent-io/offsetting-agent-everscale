# Offestting Agent for DAO IPCI on Everscale

Agent is listening to IPFS pubsub topic specified in `config`. The message's format is specified in `message_example.json`. If `auditor` addresses in config and message are the same the corresponds count of assets will be mint and transfer to user's account.

Requirements:
- node ^16.17.1

Installation:

Clone the repo and install dependencies
```
git clone https://github.com/tubleronchik/offsetting-agent-everscale.git
cd offsetting-agent-everscale
npm install
```
Copy `config/config_example.js` to `config/config.js` and add network endpoint, asset factory address in DAO, auditor's address and its seed phrase.

To launch run
```
node agent.js
```
---
### Contracts on Devnet
#### AssetFactory
> 0:05e30bf3eae57adf9f5b6e45d4f55ffbb0dbf6e9b8d7441a67167631ce2675eb
#### Auditor
> 0:22d976b931c4686dc1eba73bf72dfb618bdf869b5bac77c0025af7917a3571db
#### User
> 0:8378231949d0945553926f0fd4798c48bcfb4343bea528b6f6383e6bd1b8e4ba
#### Asset
> 0:d3a9051e2dfef4ff7effcb4aa42db2a9d8b8415cc2214e53b1a3e0f97195d444