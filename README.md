# iolo

Welcome to **iolo**

Solving an ancient process in the new world of Web3: Inheritance! From simply granting your beloved ones access to your funds, all the way to setting up autonomous communities of heirs in the form of DAOs using state of the art technology and cryptography, iolo provides you the peace of mind required in a most delicate matter.

Link to the full medium paper: https://medium.com/blockwerk/ic-crypt-6617ef2044e6

## Prerequisits
* Install rust (preferably via rustup)
* Install dfx
* If needed run `rustup target add wasm32-unknown-unknown`

## Running the project locally

If you want to test the iolo project locally, you can use the following commands:

```bash
# Deploys all canisters locally
./deploy.sh local

# stop local canister
killall dfx

# Run the frontend
npm install
npm start
```

## Testing

Navigate into the backend canister folder.

```bash
# To run all unit tests
cargo ut

# To run all integration tests
cargo it

# To derive the candid specification
cargo candid
```

## Generating the interfaces to candid

```bash
# run 
cargo candid

#Copy the did output of the console to the did file

# Deploys all canisters locally
./deploy local
```
