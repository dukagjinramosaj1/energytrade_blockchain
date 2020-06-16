# Design, implementation and evaluation of blockchain-based energy trading

Created as Master Thesis project in ISE department at TU Berlin


### Prerequisites

- Install Truffle `npm install -g truffle` Truffle ^v5.0.14 (core: 5.0.14)
- Install Ganache (https://truffleframework.com/docs/ganache/quickstart)
- Install Metamask extension on your browser  (https://metamask.io/) 

- Solidity v0.5.0 (solc-js)
- Node v10.6.0
- Web3.js v1.0.0-beta.37


### Deployment 
- First run Ganache as a Quickstart workspace
- Second connect Metamask with Ganache: 
   - In Metamask "import using account seed phrase" copy the Mnemonic from Ganache to Metamask

### Get Started 
- in the app/ directory run `npm install` to install the dependencies of the project
- run `truffle migrate --` to compile and deploy the contracts
- in app directory run `npm run dev` to run the web client which runs on localhost:8080

### Unit Tests
- run test on terminal from the main directory `truffle test ./test/market.js`

