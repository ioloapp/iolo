# IC Crypt - DFINITY Developer Grant Program - Milestones

Welcome to the IC Crypt

Solving an ancient process in the new world of Web3: Inheritance! From simply granting your beloved ones access to your funds, all the way to setting up autonomous communities of heirs in the form of DAOs using state of the art technology and cryptography, IC Crypt provides you the peace of mind required in a most delicate matter.

Link to the full medium paper: https://medium.com/blockwerk/ic-crypt-6617ef2044e6

## Milestones

### Milestone 1. Smart Vault implementation

This milestone encompasses the implementation of Phase I (Smart Vaults):
- Secure storage of secrets (Logins, passphrases, documents, etc.)
- Inheritance feature (Dead Man's Switch)
- Analysis of a multi-canister setup for storing larger data (e.g. documents)

Key part will be the inheritance feature which is basically an adoption of the so called "Dead Man's Switch" problem for the Internet Computer.

### Milestone 2. End to end encryption including Mocking of On-Chain encryption (aka. threshold key derivation)

For this milestone we will implement the full end-to-end encryption of the smart vaults using the IC's on-chain encryption features. As the feature is currently being built by the DFINITY team (Aisling and Greg) we will mock it, i.e. we will mock the enablement of canisters to deterministically derive strong cryptographic key which can then be used for encryption. We want those keys to be delivered straight to the user front-end.

We will work together with Aisling and Greg closely and we will reuse the system API proposed in the early design specs.

### Milestone 3. Setup IC Crypt as an SNS (DAO)

As the whole IC Crypto project heavily is based upon security and trust, we will set up IC Crypto as an SNS, decentralizing control of the repo and processes for the further evolution of the IC Crypt.

## Outlook

After this initial work we will continue with phases II (smart wallets) and III (smart DAOs). See the medium article for more information.