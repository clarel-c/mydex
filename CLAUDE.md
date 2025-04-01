# MyDEX Project Guidelines

## Commands
- **Build**: `npm run build` - Create production build
- **Start**: `npm start` - Run development server
- **Test (React)**: `npm test` - Run React tests (watch mode)
- **Test (Contract - All)**: `npx hardhat test` - Run all Hardhat tests
- **Test (Contract - Single)**: `npx hardhat test test/Token.js` - Run specific test file
- **Test (Contract - Specific)**: `npx hardhat test --grep "has the correct name"` - Run specific test
- **Deploy Contracts**: `npx hardhat run scripts/1_deploy.js --network localhost`
- **Seed Exchange**: `npx hardhat run scripts/2_seed-exchange.js --network localhost`
- **Local Node**: `npx hardhat node` - Run local Hardhat network

## Code Style Guidelines
- **Imports**: Group imports by type (React, external libs, internal components)
- **Formatting**: 2-space indentation, single quotes for JS, double quotes for Solidity
- **Solidity**: Use SafeMath for arithmetic, check conditions with require, emit events after state changes
- **Function Order**: Public/external methods first, followed by internal/private
- **Naming**: camelCase for variables/functions, PascalCase for components/contracts
- **Error Handling**: React components use try/catch; Solidity uses require with clear messages
- **Redux**: Use thunks for async actions, normalize state, use selectors for data access

## Development Process
- Run local Hardhat node first, then deploy contracts, seed exchange, and start React app