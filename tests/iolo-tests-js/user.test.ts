import { expect, test, describe } from 'vitest'
import { determineBackendCanisterId, createIdentity, createNewActor } from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {Result, Result_3, User, UserType} from "../../src/declarations/iolo_backend/iolo_backend.did";
import type {Principal} from "@dfinity/principal";

const canisterId: string = determineBackendCanisterId();

// Very insecure seed, use only for test purposes
const seedOne: string = 'test test test test test test test test test test test test';
const identityOne: Secp256k1KeyIdentity = createIdentity(seedOne);
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const identityThree: Secp256k1KeyIdentity = createIdentity();

const actorOne = createNewActor(identityOne, canisterId);
const actorTwo = createNewActor(identityTwo, canisterId);
const actorThree = createNewActor(identityThree, canisterId);

let userOneDateCreated: bigint;
let userOneDateModified: bigint;
let userOneDateLastLogin: bigint;

describe("User Tests", () => {
    test("it should create different users", async () => {
        const resultOne: Result_3 = await actorOne.delete_user(); // Just in case the user is already existing on the replica
        const resultTwo: Result_3 = await actorTwo.delete_user(); // Just in case the user is already existing on the replica
        const resultThree: Result_3 = await actorThree.delete_user(); // Just in case the user is already existing on the replica

        // Create user of type Person wit all optional fields
        const addUserArgsOne = {
            id: identityOne.getPrincipal(), // will be overwritten anyway by the backend
            name: ['Alice'],
            email: ['alice@ioloapp.io'],
            user_type: [{ 'Person' : null }],
        };
        const userOne: Result = await actorOne.create_user(addUserArgsOne);
        expect(userOne).toHaveProperty('Ok');
        expect(userOne['Ok'].date_created).toBeGreaterThan(0);
        expect(userOne['Ok'].date_created).toStrictEqual(userOne['Ok'].date_modified);
        expect(userOne['Ok'].user_vault_id).toHaveLength(1);
        expect(userOne['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(userOne['Ok'].id).toStrictEqual(identityOne.getPrincipal());
        expect(userOne['Ok'].user_type).toHaveLength(1);
        expect(userOne['Ok'].user_type[0]).toStrictEqual({ 'Person' : null });
        expect(userOne['Ok'].name).toHaveLength(1);
        expect(userOne['Ok'].name[0]).toStrictEqual('Alice');
        expect(userOne['Ok'].email).toHaveLength(1);
        expect(userOne['Ok'].email[0]).toStrictEqual('alice@ioloapp.io');
        expect(userOne['Ok'].date_last_login).toHaveLength(1);
        expect(userOne['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(userOne['Ok'].date_last_login[0]).toStrictEqual(userOne['Ok'].date_created);
        userOneDateCreated = userOne['Ok'].date_created; // For later comparison
        userOneDateModified = userOne['Ok'].date_modified; // For later comparison
        userOneDateLastLogin = userOne['Ok'].date_last_login[0]; // For later comparison


        // Create user of type Person wit all optional fields
        const addUserArgsTwo = {
            id: identityTwo.getPrincipal(), // will be overwritten anyway by the backend
            name: ['AliceCompany'],
            email: ['alicecompany@ioloapp.io'],
            user_type: [{ 'Company' : null }],
        };
        const userTwo: Result = await actorTwo.create_user(addUserArgsTwo);
        expect(userTwo).toHaveProperty('Ok');
        expect(userTwo['Ok'].date_created).toBeGreaterThan(0);
        expect(userTwo['Ok'].date_created).toStrictEqual(userTwo['Ok'].date_modified);
        expect(userTwo['Ok'].user_vault_id).toHaveLength(1);
        expect(userTwo['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(userTwo['Ok'].id).toStrictEqual(identityTwo.getPrincipal());
        expect(userTwo['Ok'].user_type).toHaveLength(1);
        expect(userTwo['Ok'].user_type[0]).toStrictEqual({ 'Company' : null });
        expect(userTwo['Ok'].name).toHaveLength(1);
        expect(userTwo['Ok'].name[0]).toStrictEqual('AliceCompany');
        expect(userTwo['Ok'].email).toHaveLength(1);
        expect(userTwo['Ok'].email[0]).toStrictEqual('alicecompany@ioloapp.io');
        expect(userTwo['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(userTwo['Ok'].date_last_login[0]).toStrictEqual(userTwo['Ok'].date_created);

        // Create user with only mandatory fields
        const addUserArgsThree = {
            id: identityThree.getPrincipal(),
            name: [],
            email: [],
            user_type: [],
        };
        const userThree: Result = await actorThree.create_user(addUserArgsThree);
        expect(userThree).toHaveProperty('Ok');
        expect(userThree['Ok'].date_created).toBeGreaterThan(0);
        expect(userThree['Ok'].date_created).toStrictEqual(userThree['Ok'].date_modified);
        expect(userThree['Ok'].user_vault_id).toHaveLength(1);
        expect(userThree['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(userThree['Ok'].id).toStrictEqual(identityThree.getPrincipal());
        expect(userThree['Ok'].user_type).toHaveLength(0);
        expect(userThree['Ok'].name).toHaveLength(0);
        expect(userThree['Ok'].email).toHaveLength(0);
        expect(userThree['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(userThree['Ok'].date_last_login[0]).toStrictEqual(userThree['Ok'].date_created);

        // All users should have an uservault
        const vaultOne: boolean = await actorOne.is_user_vault_existing();
        expect(vaultOne).toBe(true);
        const vaultTwo: boolean = await actorTwo.is_user_vault_existing();
        expect(vaultTwo).toBe(true);
        const vaultThree: boolean = await actorThree.is_user_vault_existing();
        expect(vaultThree).toBe(true);

    }, 20000); // Set timeout

    test("it should not create the same user twice", async () => {
        // Create first user again, must fail
        const addUserArgsOne = {
            id: identityOne.getPrincipal(),
            name: ['Eve'],
            email: ['eve@ioloapp.org'],
            user_type: [{ 'Person' : null }],
        };

        const userOneAgain: Result = await actorOne.create_user(addUserArgsOne);
        expect(userOneAgain).toHaveProperty('Err');
        expect(userOneAgain['Err']).toHaveProperty('UserAlreadyExists');

        // The next test ensures that the user has not been overwritten

    }, 10000); // Set timeout

    test("it should read the current user properly", async () => {
        const currentUser: Result = await actorOne.get_current_user();
        expect(currentUser).toHaveProperty('Ok');
        expect(currentUser['Ok'].date_created).toStrictEqual(userOneDateCreated);
        expect(currentUser['Ok'].date_modified).toStrictEqual(userOneDateModified);
        expect(currentUser['Ok'].user_vault_id).toHaveLength(1);
        expect(currentUser['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(currentUser['Ok'].id).toStrictEqual(identityOne.getPrincipal());
        expect(currentUser['Ok'].user_type).toHaveLength(1);
        expect(currentUser['Ok'].user_type[0]).toStrictEqual({ 'Person' : null });
        expect(currentUser['Ok'].name).toHaveLength(1);
        expect(currentUser['Ok'].name[0]).toStrictEqual('Alice');
        expect(currentUser['Ok'].email).toHaveLength(1);
        expect(currentUser['Ok'].email[0]).toStrictEqual('alice@ioloapp.io');
        expect(currentUser['Ok'].date_last_login).toHaveLength(1);
        expect(currentUser['Ok'].date_last_login[0]).toStrictEqual(userOneDateLastLogin);
    }, 10000); // Set timeout

    test("it should update a user properly", async () => {
        const currentUser: Result = await actorOne.get_current_user(); // Get current user to compare later
        expect(currentUser).toHaveProperty('Ok');

        const updatedUser: User = currentUser['Ok'];
        updatedUser.id = identityTwo.getPrincipal(); // Should not be updatable
        updatedUser.name = ['AliceUpdated'];
        updatedUser.email = ['aliceupdated@ioloapp.io'];
        updatedUser.user_type = [{ 'Company' : null }]; // Should not be updatable
        updatedUser.date_modified = BigInt(Date.now() * 1000); // Should not be updatable
        updatedUser.date_created = BigInt(Date.now() * 1000); // Should not be updatable
        updatedUser.date_last_login = [BigInt(Date.now() * 1000)]; // Should not be updatable

        // Only mail and name should have been updated
        const resultUpdatedUser: Result = await actorOne.update_user(updatedUser);
        expect(resultUpdatedUser).toHaveProperty('Ok');
        expect(resultUpdatedUser['Ok'].date_created).toStrictEqual(currentUser['Ok'].date_created);
        expect(resultUpdatedUser['Ok'].date_modified).toStrictEqual(currentUser['Ok'].date_modified);
        expect(resultUpdatedUser['Ok'].user_vault_id).toStrictEqual(currentUser['Ok'].user_vault_id);
        expect(resultUpdatedUser['Ok'].id).toStrictEqual(identityOne.getPrincipal());
        expect(resultUpdatedUser['Ok'].user_type).toStrictEqual(currentUser['Ok'].user_type);
        expect(resultUpdatedUser['Ok'].name).toStrictEqual(updatedUser.name);
        expect(resultUpdatedUser['Ok'].email).toStrictEqual(updatedUser.email);
        expect(resultUpdatedUser['Ok'].date_last_login).toStrictEqual(currentUser['Ok'].date_last_login);

    }, 15000); // Set timeout

    test("it should update the last_login_date properly", async () => {

    }, 15000); // Set timeout

    test("it should delete a user properly", async () => {
        // Delete user
        let resultOne = await actorOne.delete_user();
        expect(resultOne).toHaveProperty('Ok');

        // User should not have an uservault
        const vaultOne: boolean = await actorOne.is_user_vault_existing();
        expect(vaultOne).toBe(false);

        // Delete user again, must fail
        resultOne = await actorOne.delete_user();
        expect(resultOne).toHaveProperty('Err');

        // Create same user again, must work because it has been deleted
        const addUserArgsOne = {
            id: identityOne.getPrincipal(),
            name: ['Alice'],
            email: ['alice@ioloapp.io'],
            user_type: [{ 'Person' : null }],
        };
        const userOneAgain: Result = await actorOne.create_user(addUserArgsOne);
        expect(userOneAgain).toHaveProperty('Ok');
        expect(userOneAgain['Ok'].id).toStrictEqual(identityOne.getPrincipal());

    }, 15000); // Set timeout
});