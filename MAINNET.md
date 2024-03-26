# Know-How for mainnet deployment

## Documentation
* https://internetcomputer.org/docs/current/developer-docs/setup/cycles/cycles-wallet
* https://internetcomputer.org/docs/current/developer-docs/setup/deploy-mainnet
* https://internetcomputer.org/docs/current/references/cli-reference/dfx-wallet

## Principals & Identities
* Controller principal: Owner of the canister (person, organization or canister)
* Canister/cycles wallet: special canister for managing cycles, with the following roles for principals:
  * Controller (NOT the same as controller principal!): highest permissions (max. 10 controllers) 
  * Custodian: Less permissions, i.e. access to balance, send cycles to canisters, create canisters
* Production canisters require principals that act as custodians: principals that have the permission to send and receive cycles for a canister
* Developer identity (principal identifier) != account identifier (specified on ledger), they are related but use different formats

## Prepare Mainnet Deployment
1. Create a new developer identity: `dfx identity new iolo-dev`
2. **IMPORTANT: Store the seed phrase securely!**
3. Use this identity: `dfx identity use iolo-dev`
4. **ONLY ONCE PER PROJECT**: create a cycles wallet by:
   * **EITHER** Using cycles faucet by dfinity (which implicitly creates a new wallet canister on mainnet):
     * Follow https://internetcomputer.org/docs/current/developer-docs/setup/cycles/cycles-faucet to get a coupon code
     * Redeem the cycles (make sure you use the correct principal): `dfx wallet redeem-faucet-coupon <your-coupon-code> --ic`
   * **OR** Creating a new wallet canister:
     * Prerequisite: send some ICPs to your developer account
       * Get the account-id of the developer identity: `dfx ledger account-id --ic`
       * Send some ICPs to this account
       * Get the principal of the developer identity: `dfx identity get-principal --ic`
       * Create a new canister with its controller principal and convert ICPs into cycles: `dfx ledger --network ic create-canister <your-principal> --amount <amount-in-icp> --ic`
       * Note down the canister-id
       * Deploy the cycles wallet app onto the canister: `dfx identity deploy-wallet <canister-id> --ic`
5. Check the balance of the newly created wallet: `dfx wallet balance --ic`
6. **LATER**: Fill an existing cycles wallet with new cycles: `dfx ledger top-up <wallet-canister-id> --amount <amount-in-icp> --ic`

After these steps you have a cycles wallet on mainnet with the developer identity as controller. This can be validated by:
* `dfx wallet controllers --ic` should return the principal of the developer identity
* `dfx wallet custodians --ic ` should return an empty list
* Alternatively you can use `dfx wallet addresses --ic` to see all controllers and custsodians

Now you can add additional controllers and custodians for your developer crew:
* Add a new controller: `dfx wallet add-controller <principal> --ic`
* Add a new custodian: `dfx wallet authorize <principal> --ic`
You can add for example your "normal" principal (internet-identity-based) as custodian and then visit the cycles wallet frontend at `https://<cycles-wallet-canister-id>.icp0.io`

## Mainnet deployment
* Make sure you're in the project's root folder and are using the developer identity
* Use `dfx deploy --ic` to deploy all canisters onto mainnet
* Note the canister ids!

## Mainnet canister management
* Canister status: `dfx canister status iolo_backend --ic`
* Stop canister: `dfx canister stop iolo_backend --ic`
* Start canister: `dfx canister start iolo_backend --ic`
* Delete canister: `dfx canister delete iolo_backend --ic`
* Re-install code onto a canister (keeps canister ids, but deletes code and state): `dfx canister install iolo_backend --mode reinstall --ic`
* Upgrade code on a canister (keeps canister ids and state): `dfx canister install iolo_backend --mode upgrade --ic`


## Current mainnet canister IDs:
* Frontend canister via browser
  * iolo_frontend: https://cyznk-kaaaa-aaaal-qcrcq-cai.icp0.io/
* Backend canister via Candid interface:
  * iolo_backend: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=c7yl6-hyaaa-aaaal-qcrca-cai
  * system_api: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=cr2gw-4iaaa-aaaal-qcrda-cai
