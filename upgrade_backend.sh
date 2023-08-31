#!/bin/bash

dfx build iccrypt_backend
dfx canister install -m reinstall iccrypt_backend <<< "yes"