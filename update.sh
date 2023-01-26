#!/bin/bash

# Call the script with deploy.sh {network}
if [[ $# -lt 1 ]]; then
    echo "Number of arguments supplied not correct. Call this script: \
    ./deploy.sh {env} \
    env should be one of the networks configured in dfx.json."
    exit 1
fi

ENV=$1

dfx canister uninstall-code iccrypt_backend --network "$ENV"
dfx canister install iccrypt_backend
dfx deploy iccrypt_backend
