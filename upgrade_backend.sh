#!/bin/bash

# dfx stop
# dfx start --background --clean
# dfx canister create system_api --specified-id s55qq-oqaaa-aaaaa-aaakq-cai
# dfx deploy iccrypt_backend

dfx build iccrypt_backend
dfx canister install -m reinstall iccrypt_backend <<< "yes"