import { determineBackendCanisterId, createIdentity, createNewActor } from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {Result_2, Result_3} from "../../.dfx/local/canisters/iccrypt_backend/service.did";

const canisterId: string = determineBackendCanisterId();

// Very insecure seed, use only for test purposes
const seedOne: string = 'test test test test test test test test test test test test';
const identityOne: Secp256k1KeyIdentity = createIdentity(seedOne);
const identityTwo: Secp256k1KeyIdentity = createIdentity();

const actorOne = createNewActor(identityOne, canisterId);
const actorTwo = createNewActor(identityTwo, canisterId);

describe("User Tests", () => {
    test("it should create two different users", async () => {
        const resultOne: Result_3 = await actorOne.delete_user(); // Just in case the user is already existing on the replica
        const resultTwo: Result_3 = await actorTwo.delete_user(); // Just in case the user is already existing on the replica

        // Create first user
        const userOne: Result_2 = await actorOne.create_user();
        expect(userOne).toHaveProperty('Ok');
        expect(userOne['Ok'].date_created).toBe(userOne['Ok'].date_modified);
        expect(userOne['Ok'].user_vault_id).toBeGreaterThan(0);
        expect(userOne['Ok'].id).toStrictEqual(identityOne.getPrincipal());

        // Create second user
        const userTwo: Result_2 = await actorTwo.create_user();
        expect(userTwo).toHaveProperty('Ok');
        expect(userTwo['Ok'].date_created).toBe(userTwo['Ok'].date_modified);
        expect(userTwo['Ok'].user_vault_id).toBeGreaterThan(0);
        expect(userTwo['Ok'].id).toStrictEqual(identityTwo.getPrincipal());
        expect(userTwo['Ok'].id).not.toStrictEqual(userOne['Ok'].id);
        expect(userTwo['Ok'].date_created).not.toBe(userOne['Ok'].date_created);
        expect(userTwo['Ok'].user_vault_id).not.toBe(userOne['Ok'].user_vault_id);

        // Both users should have a uservault
        const vaultOne: boolean = await actorOne.is_user_vault_existing();
        expect(vaultOne).toBe(true);
        const vaultTwo: boolean = await actorTwo.is_user_vault_existing();
        expect(vaultTwo).toBe(true);

    }, 10000); // Set timeout to 10s

    test("it should not create the same user twice", async () => {
        const resultOne: Result_3 = await actorOne.delete_user(); // Just in case the user is already existing on the replica

        // Create first user
        const userOne: Result_2 = await actorOne.create_user();
        expect(userOne).toHaveProperty('Ok');

        // Create same user again, must fail
        const userOneAgain: Result_2 = await actorOne.create_user();
        expect(userOneAgain).toHaveProperty('Err');
        expect(userOneAgain['Err']).toHaveProperty('UserAlreadyExists');

    }, 10000); // Set timeout to 10s

    test("it should delete a user properly", async () => {
        let resultOne: Result_3 = await actorOne.delete_user(); // Just in case the user is already existing on the replica

        // Create first user
        const userOne: Result_2 = await actorOne.create_user();
        expect(userOne).toHaveProperty('Ok');

        // Delete user
        resultOne = await actorOne.delete_user();
        expect(resultOne).toHaveProperty('Ok');

        // User should not have a uservault
        const vaultOne: boolean = await actorOne.is_user_vault_existing();
        expect(vaultOne).toBe(false);

        // Delete user again, must fail
        resultOne = await actorOne.delete_user();
        expect(resultOne).toHaveProperty('Err');

        // Create same user again, must work because it has been deleted
        const userOneAgain: Result_2 = await actorOne.create_user();
        expect(userOneAgain).toHaveProperty('Ok');
        expect(userOneAgain['Ok'].id).toStrictEqual(identityOne.getPrincipal());

    }, 15000); // Set timeout to 15s
});