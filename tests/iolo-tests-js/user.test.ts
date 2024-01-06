import { determineBackendCanisterId, createIdentity, createNewActor } from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {Result_2, Result_3} from "../../.dfx/local/canisters/iolo_backend/service.did";

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

        // Create first user wit all optional fields
        const addUserArgsOne = {
            id: createIdentity().getPrincipal(),
            name: ['Alice'],
            email: ['alice@ioloapp.io'],
            user_type: [{ 'Person' : null }],
        };
        const userOne: Result_2 = await actorOne.create_user(addUserArgsOne);
        expect(userOne).toHaveProperty('Ok');
        expect(userOne['Ok'].date_created).toBe(userOne['Ok'].date_modified);
        expect(userOne['Ok'].user_vault_id).toHaveLength(1);
        expect(userOne['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(userOne['Ok'].id).toStrictEqual(identityOne.getPrincipal());
        expect(userOne['Ok'].user_type).toHaveLength(1);
        expect(userOne['Ok'].user_type[0]).toStrictEqual({ 'Person' : null });
        expect(userOne['Ok'].name).toHaveLength(1);
        expect(userOne['Ok'].name[0]).toStrictEqual('Alice');
        expect(userOne['Ok'].email).toHaveLength(1);
        expect(userOne['Ok'].email[0]).toStrictEqual('alice@ioloapp.io');

        // Create second user with only mandatory fields
        const addUserArgsTwo = {
            id: createIdentity().getPrincipal(),
            name: [],
            email: [],
            user_type: [],
        };
        const userTwo: Result_2 = await actorTwo.create_user(addUserArgsTwo);
        expect(userTwo).toHaveProperty('Ok');
        expect(userTwo['Ok'].date_created).toBe(userTwo['Ok'].date_modified);
        expect(userTwo['Ok'].user_vault_id).toHaveLength(1);
        expect(userTwo['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(userTwo['Ok'].id).toStrictEqual(identityTwo.getPrincipal());
        expect(userTwo['Ok'].id).not.toStrictEqual(userOne['Ok'].id);
        expect(userTwo['Ok'].date_created).not.toBe(userOne['Ok'].date_created);
        expect(userTwo['Ok'].user_vault_id).not.toBe(userOne['Ok'].user_vault_id);
        expect(userTwo['Ok'].user_type).toHaveLength(0);
        expect(userTwo['Ok'].name).toHaveLength(0);
        expect(userTwo['Ok'].email).toHaveLength(0);

        // Both users should have an uservault
        const vaultOne: boolean = await actorOne.is_user_vault_existing();
        expect(vaultOne).toBe(true);
        const vaultTwo: boolean = await actorTwo.is_user_vault_existing();
        expect(vaultTwo).toBe(true);

    }, 10000); // Set timeout to 10s

    test("it should not create the same user twice", async () => {
        const resultOne: Result_3 = await actorOne.delete_user(); // Just in case the user is already existing on the replica

        // Create first user
        const addUserArgsOne = {
            id: createIdentity().getPrincipal(),
            name: ['Alice'],
            email: ['alice@ioloapp.org'],
            user_type: [{ 'Person' : null }],
        };
        const userOne: Result_2 = await actorOne.create_user(addUserArgsOne);
        expect(userOne).toHaveProperty('Ok');

        // Create same user again, must fail
        const userOneAgain: Result_2 = await actorOne.create_user(addUserArgsOne);
        expect(userOneAgain).toHaveProperty('Err');
        expect(userOneAgain['Err']).toHaveProperty('UserAlreadyExists');

    }, 10000); // Set timeout to 10s

    test("it should delete a user properly", async () => {
        let resultOne: Result_3 = await actorOne.delete_user(); // Just in case the user is already existing on the replica

        // Create first user
        const addUserArgsOne = {
            id: createIdentity().getPrincipal(),
            name: ['Alice'],
            email: ['alice@ioloapp.org'],
            user_type: [{ 'Person' : null }],
        };
        const userOne: Result_2 = await actorOne.create_user(addUserArgsOne);
        expect(userOne).toHaveProperty('Ok');

        // Delete user
        resultOne = await actorOne.delete_user();
        expect(resultOne).toHaveProperty('Ok');

        // User should not have an uservault
        const vaultOne: boolean = await actorOne.is_user_vault_existing();
        expect(vaultOne).toBe(false);

        // Delete user again, must fail
        resultOne = await actorOne.delete_user();
        expect(resultOne).toHaveProperty('Err');

        // Create same user again, must work because it has been deleted
        const userOneAgain: Result_2 = await actorOne.create_user(addUserArgsOne);
        expect(userOneAgain).toHaveProperty('Ok');
        expect(userOneAgain['Ok'].id).toStrictEqual(identityOne.getPrincipal());

    }, 15000); // Set timeout to 15s
});