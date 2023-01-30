# IC Crypt

Welcome to the IC Crypt

Solving an ancient process in the new world of Web3: Inheritance! From simply granting your beloved ones access to your funds, all the way to setting up autonomous communities of heirs in the form of DAOs using state of the art technology and cryptography, IC Crypt provides you the peace of mind required in a most delicate matter.

Link to the full medium paper: https://medium.com/blockwerk/ic-crypt-6617ef2044e6

## Grant application roadmap and milestones

### 1. Smart Vault implementation

This milestone encompasses the implementation of Phase I (Smart Vaults):
- Secure storage of secrets
- End to end encryption (see milestone 2)
- Inheritance feature (Dead Man's Switch)

As noted above, for the end-to-end encryption to work we will mock the on-chain encryption feature in a seperate canister. 

Key part will be the inheritance feature which is basically an adoption of the so called "Dead Man's Switch" problem for the Internet Computer. This we will do together with Aisling and Greg from the DFINITY team.

### 2. Mocking of On-Chain encryption (aka. threshold key derivation)

For this milestone we want to mock the on-chain encryption feature, i.e. enabling canisters to deterministically derive strong cryptographic key which can then be used for encryption. We want those keys to be delivered straight to the user front-end.

We will reuse the system API proposed in the early design specs provided by Aisling and Greg.

### 3. Setup IC Crypt as an SNS (DAO)

As the whole IC Crypto project really is based upon security and trust, we will set up IC Crypto as an SNS, decentralizing control of the repo and processes.



