#!/bin/bash

dfx stop
dfx start --background --clean
dfx canister create system_api --specified-id cr2gw-4iaaa-aaaal-qcrda-cai
dfx deploy iolo_backend

dfx build iolo_backend
dfx canister install -m reinstall iolo_backend <<< "yes"
