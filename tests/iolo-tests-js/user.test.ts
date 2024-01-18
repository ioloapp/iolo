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

let userOneForComparison: User = {} as User;

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
        expect(userOne['Ok'].id).toStrictEqual(identityOne.getPrincipal());
        expect(userOne['Ok'].user_vault_id).toHaveLength(1);
        expect(userOne['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(userOne['Ok'].user_type).toStrictEqual([{ 'Person' : null }]);
        expect(userOne['Ok'].name).toStrictEqual(['Alice']);
        expect(userOne['Ok'].email).toStrictEqual(['alice@ioloapp.io']);
        expect(userOne['Ok'].date_last_login).toHaveLength(1);
        expect(userOne['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(userOne['Ok'].date_last_login[0]).toStrictEqual(userOne['Ok'].date_created);
        expect(userOne['Ok'].date_created).toBeGreaterThan(0);
        expect(userOne['Ok'].date_modified).toBeGreaterThan(0);

        // Save user for later comparison
        userOneForComparison = userOne['Ok'];

        // Create user of type Company with all optional fields
        const addUserArgsTwo = {
            id: identityTwo.getPrincipal(), // will be overwritten anyway by the backend
            name: ['AliceCompany'],
            email: ['alicecompany@ioloapp.io'],
            user_type: [{ 'Company' : null }],
        };
        const userTwo: Result = await actorTwo.create_user(addUserArgsTwo);
        expect(userTwo).toHaveProperty('Ok');
        expect(userTwo['Ok'].id).toStrictEqual(identityTwo.getPrincipal());
        expect(userTwo['Ok'].user_vault_id).toHaveLength(1);
        expect(userTwo['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(userTwo['Ok'].user_type).toStrictEqual([{ 'Company' : null }]);
        expect(userTwo['Ok'].name).toStrictEqual(['AliceCompany']);
        expect(userTwo['Ok'].email).toStrictEqual(['alicecompany@ioloapp.io']);
        expect(userTwo['Ok'].date_last_login).toHaveLength(1);
        expect(userTwo['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(userTwo['Ok'].date_last_login[0]).toStrictEqual(userTwo['Ok'].date_created);
        expect(userTwo['Ok'].date_created).toBeGreaterThan(0);
        expect(userTwo['Ok'].date_modified).toBeGreaterThan(0);

        // Create user with only mandatory fields
        const addUserArgsThree = {
            id: identityThree.getPrincipal(),
            name: [],
            email: [],
            user_type: [],
        };
        const userThree: Result = await actorThree.create_user(addUserArgsThree);
        expect(userThree).toHaveProperty('Ok');
        expect(userThree['Ok'].id).toStrictEqual(identityThree.getPrincipal());
        expect(userThree['Ok'].user_vault_id).toHaveLength(1);
        expect(userThree['Ok'].user_vault_id[0]).toBeGreaterThan(0);
        expect(userThree['Ok'].user_type).toHaveLength(0);
        expect(userThree['Ok'].name).toHaveLength(0);
        expect(userThree['Ok'].email).toHaveLength(0);
        expect(userThree['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(userThree['Ok'].date_last_login[0]).toStrictEqual(userThree['Ok'].date_created);
        expect(userThree['Ok'].date_created).toBeGreaterThan(0);
        expect(userThree['Ok'].date_modified).toBeGreaterThan(0);

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
            email: ['eve@ioloapp.io'],
            user_type: [{ 'Person' : null }],
        };

        const userOneAgain: Result = await actorOne.create_user(addUserArgsOne);
        expect(userOneAgain).toHaveProperty('Err');
        expect(userOneAgain['Err']).toHaveProperty('UserAlreadyExists');

        // The next test ensures that no attributes of the user have been overwritten

    }, 10000); // Set timeout

    test("it should read the current user properly", async () => {
        const currentUser: Result = await actorOne.get_current_user();

        expect(currentUser).toHaveProperty('Ok');
        expect(currentUser['Ok']).toStrictEqual(userOneForComparison);
    }, 10000); // Set timeout

    test("it should update a user properly", async () => {
        const currentUser: Result = await actorOne.get_current_user();
        expect(currentUser).toHaveProperty('Ok');

        const updatedUser: User = {
            id: identityTwo.getPrincipal(), // Should not be updatable
            user_vault_id: [BigInt(0)], // Should not be updatable
            name: ['AliceUpdated'],
            email: ['aliceupdated@ioloapp.io'],
            user_type: [{ 'Company' : null }],
            date_modified: BigInt(Date.now() * 1000), // Should not be updatable
            date_created: BigInt(Date.now() * 1000), // Should not be updatable
            date_last_login: [BigInt(Date.now() * 1000)], // Should not be updatable
        };


        // Only mail, name and user_type should have been updated
        const resultUpdatedUser: Result = await actorOne.update_user(updatedUser);
        expect(resultUpdatedUser).toHaveProperty('Ok');
        expect(resultUpdatedUser['Ok'].id).toStrictEqual(currentUser['Ok'].id);
        expect(resultUpdatedUser['Ok'].user_vault_id).toStrictEqual(currentUser['Ok'].user_vault_id);
        expect(resultUpdatedUser['Ok'].user_type).toStrictEqual(updatedUser.user_type);
        expect(resultUpdatedUser['Ok'].name).toStrictEqual(updatedUser.name);
        expect(resultUpdatedUser['Ok'].email).toStrictEqual(updatedUser.email);
        expect(resultUpdatedUser['Ok'].date_last_login).toStrictEqual(currentUser['Ok'].date_last_login);
        expect(resultUpdatedUser['Ok'].date_created).toStrictEqual(currentUser['Ok'].date_created);
        expect(resultUpdatedUser['Ok'].date_modified).toStrictEqual(currentUser['Ok'].date_modified);

    }, 15000); // Set timeout

    test("it should update the last_login_date properly", async () => {
        const currentUser: Result = await actorOne.get_current_user();
        expect(currentUser).toHaveProperty('Ok');

        const resultUpdatedUser: Result = await actorOne.update_user_login_date();
        expect(resultUpdatedUser).toHaveProperty('Ok');
        expect(resultUpdatedUser['Ok'].id).toStrictEqual(currentUser['Ok'].id);
        expect(resultUpdatedUser['Ok'].user_vault_id).toStrictEqual(currentUser['Ok'].user_vault_id);
        expect(resultUpdatedUser['Ok'].user_type).toStrictEqual(currentUser['Ok'].user_type);
        expect(resultUpdatedUser['Ok'].name).toStrictEqual(currentUser['Ok'].name);
        expect(resultUpdatedUser['Ok'].email).toStrictEqual(currentUser['Ok'].email);
        expect(resultUpdatedUser['Ok'].date_last_login).toHaveLength(1);
        expect(resultUpdatedUser['Ok'].date_last_login[0]).toBeGreaterThan(currentUser['Ok'].date_last_login[0]);
        expect(resultUpdatedUser['Ok'].date_created).toStrictEqual(currentUser['Ok'].date_created);
        expect(resultUpdatedUser['Ok'].date_modified).toBeGreaterThan(currentUser['Ok'].date_modified);

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
        expect(resultOne['Err']).toHaveProperty('UserDoesNotExist');

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

        // Delete user
        let resultTwo = await actorTwo.delete_user();
        expect(resultTwo).toHaveProperty('Ok');

        // Delete user
        let resultThree = await actorThree.delete_user();
        expect(resultThree).toHaveProperty('Ok');

    }, 15000); // Set timeout
});