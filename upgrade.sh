#!/bin/bash

npm install

# dfx canister stop --all
# dfx canister create -all
dfx build -all
dfx canister install iccrypt_backend
dfx canister install iccrypt_frontend