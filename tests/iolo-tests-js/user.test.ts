import { expect, test, describe } from 'vitest'
import { determineBackendCanisterId, createIdentity, createNewActor } from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    Result,
    User,
    AddOrUpdateUserArgs,
    Result_4,
    _SERVICE
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {ActorSubclass} from "@dfinity/agent";

const canisterId: string = determineBackendCanisterId();

// Very insecure seed, use only for test purposes
const seedOne: string = 'test test test test test test test test test test test test';
const identityOne: Secp256k1KeyIdentity = createIdentity(seedOne);
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const identityThree: Secp256k1KeyIdentity = createIdentity();

const actorOne: ActorSubclass<_SERVICE> = createNewActor(identityOne, canisterId);
const actorTwo: ActorSubclass<_SERVICE> = createNewActor(identityTwo, canisterId);
const actorThree: ActorSubclass<_SERVICE> = createNewActor(identityThree, canisterId);

let userOneForComparison: User = {} as User;

/*
 This test suit tests all user related methods of the backend canister.
 Focus is on the correct return types and the correct behavior of the methods.
 */

describe("USER - create_user()", () => {
    test("it must create users properly", async () => {
        const resultOne: Result = await actorOne.delete_user(); // Just in case the user is already existing on the replica
        const resultTwo: Result = await actorTwo.delete_user(); // Just in case the user is already existing on the replica
        const resultThree: Result = await actorThree.delete_user(); // Just in case the user is already existing on the replica

        // Create user of type Person wit all optional fields
        const addOrUpdateUserArgsOne: AddOrUpdateUserArgs = {
            name: ['Alice'],
            email: ['alice@ioloapp.io'],
            user_type: [{'Person': null}],
        };
        const resultUserOne: Result_4 = await actorOne.create_user(addOrUpdateUserArgsOne);
        expect(resultUserOne).toHaveProperty('Ok');
        expect(Object.keys(resultUserOne['Ok'])).toHaveLength(11);
        expect(resultUserOne['Ok'].id).toStrictEqual(identityOne.getPrincipal().toString());
        expect(resultUserOne['Ok'].user_type).toStrictEqual([{'Person': null}]);
        expect(resultUserOne['Ok'].name).toStrictEqual(['Alice']);
        expect(resultUserOne['Ok'].email).toStrictEqual(['alice@ioloapp.io']);
        expect(resultUserOne['Ok'].date_last_login).toHaveLength(1);
        expect(resultUserOne['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(resultUserOne['Ok'].date_last_login[0]).toStrictEqual(resultUserOne['Ok'].date_created);
        expect(resultUserOne['Ok'].date_created).toBeGreaterThan(0);
        expect(resultUserOne['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultUserOne['Ok'].policies).toStrictEqual([]);
        expect(resultUserOne['Ok'].key_box).toStrictEqual([]);
        expect(resultUserOne['Ok'].secrets).toStrictEqual([]);
        expect(resultUserOne['Ok'].contacts).toStrictEqual([]);

        // Save user for later comparison
        userOneForComparison = resultUserOne['Ok'];

        // Create user of type Company with all optional fields
        const addOrUpdateUserArgsTwo: AddOrUpdateUserArgs = {
            name: ['AliceCompany'],
            email: ['alicecompany@ioloapp.io'],
            user_type: [{'Company': null}],
        };
        const resultUserTwo: Result_4 = await actorTwo.create_user(addOrUpdateUserArgsTwo);
        expect(resultUserTwo).toHaveProperty('Ok');
        expect(Object.keys(resultUserOne['Ok'])).toHaveLength(11);
        expect(resultUserTwo['Ok'].id).toStrictEqual(identityTwo.getPrincipal().toString());
        expect(resultUserTwo['Ok'].user_type).toStrictEqual([{'Company': null}]);
        expect(resultUserTwo['Ok'].name).toStrictEqual(['AliceCompany']);
        expect(resultUserTwo['Ok'].email).toStrictEqual(['alicecompany@ioloapp.io']);
        expect(resultUserTwo['Ok'].date_last_login).toHaveLength(1);
        expect(resultUserTwo['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(resultUserTwo['Ok'].date_last_login[0]).toStrictEqual(resultUserTwo['Ok'].date_created);
        expect(resultUserTwo['Ok'].date_created).toBeGreaterThan(0);
        expect(resultUserTwo['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultUserTwo['Ok'].policies).toStrictEqual([]);
        expect(resultUserTwo['Ok'].key_box).toStrictEqual([]);
        expect(resultUserTwo['Ok'].secrets).toStrictEqual([]);
        expect(resultUserTwo['Ok'].contacts).toStrictEqual([]);

        // Create user with only mandatory fields
        const addOrUpdateUserArgsThree: AddOrUpdateUserArgs = {
            name: [],
            email: [],
            user_type: [],
        };
        const resultUserThree: Result_4 = await actorThree.create_user(addOrUpdateUserArgsThree);
        expect(resultUserThree).toHaveProperty('Ok');
        expect(Object.keys(resultUserOne['Ok'])).toHaveLength(11);
        expect(resultUserThree['Ok'].id).toStrictEqual(identityThree.getPrincipal().toString());
        expect(resultUserThree['Ok'].user_type).toHaveLength(0);
        expect(resultUserThree['Ok'].name).toHaveLength(0);
        expect(resultUserThree['Ok'].email).toHaveLength(0);
        expect(resultUserThree['Ok'].date_last_login[0]).toBeGreaterThan(0);
        expect(resultUserThree['Ok'].date_last_login[0]).toStrictEqual(resultUserThree['Ok'].date_created);
        expect(resultUserThree['Ok'].date_created).toBeGreaterThan(0);
        expect(resultUserThree['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultUserThree['Ok'].policies).toStrictEqual([]);
        expect(resultUserThree['Ok'].key_box).toStrictEqual([]);
        expect(resultUserThree['Ok'].secrets).toStrictEqual([]);
        expect(resultUserThree['Ok'].contacts).toStrictEqual([]);

    }, 20000); // Set timeout

    test("it must not create a second user with the same agent", async () => {
        // Create first user again, must fail
        const addOrUpdateUserArgsOne: AddOrUpdateUserArgs = {
            name: ['Eve'],
            email: ['eve@ioloapp.io'],
            user_type: [{'Person': null}],
        };

        const userOneAgain: Result_4 = await actorOne.create_user(addOrUpdateUserArgsOne);
        expect(userOneAgain).toHaveProperty('Err');
        expect(userOneAgain['Err']).toHaveProperty('UserAlreadyExists');

        // The next test ensures that no attributes of the user have been overwritten

    }, 10000); // Set timeout

});

describe("USER - get_current_user()", () => {
    test("it must read the current user properly", async () => {
        const currentUser: Result_4 = await actorOne.get_current_user();

        expect(currentUser).toHaveProperty('Ok');
        expect(Object.keys(currentUser['Ok'])).toHaveLength(11);
        expect(currentUser['Ok']).toStrictEqual(userOneForComparison);
    }, 10000); // Set timeout
});

describe("USER - update_user()", () => {
    test("it must update a user properly", async () => {
        const currentUser: Result_4 = await actorOne.get_current_user();
        expect(currentUser).toHaveProperty('Ok');

        const addOrUpdateUserArgsOne: AddOrUpdateUserArgs = {
            name: ['AliceUpdated'],
            email: ['aliceupdated@ioloapp.io'],
            user_type: [{'Company': null}],
        };

        // Only mail, name and user_type should have been updated
        const resultUpdatedUser: Result_4 = await actorOne.update_user(addOrUpdateUserArgsOne);
        expect(resultUpdatedUser).toHaveProperty('Ok');
        expect(Object.keys(resultUpdatedUser['Ok'])).toHaveLength(11);
        expect(resultUpdatedUser['Ok'].id).toStrictEqual(currentUser['Ok'].id);
        expect(resultUpdatedUser['Ok'].user_type).toStrictEqual(addOrUpdateUserArgsOne.user_type);
        expect(resultUpdatedUser['Ok'].name).toStrictEqual(addOrUpdateUserArgsOne.name);
        expect(resultUpdatedUser['Ok'].email).toStrictEqual(addOrUpdateUserArgsOne.email);
        expect(resultUpdatedUser['Ok'].secrets).toStrictEqual(currentUser['Ok'].secrets);
        expect(resultUpdatedUser['Ok'].policies).toStrictEqual(currentUser['Ok'].policies);
        expect(resultUpdatedUser['Ok'].key_box).toStrictEqual(currentUser['Ok'].key_box);
        expect(resultUpdatedUser['Ok'].contacts).toStrictEqual(currentUser['Ok'].contacts);
        expect(resultUpdatedUser['Ok'].date_last_login).toStrictEqual(currentUser['Ok'].date_last_login);
        expect(resultUpdatedUser['Ok'].date_created).toStrictEqual(currentUser['Ok'].date_created);
        expect(resultUpdatedUser['Ok'].date_modified).toBeGreaterThan(currentUser['Ok'].date_modified);

    }, 15000); // Set timeout

});

describe("USER - update_user_login_date()", () => {
    test("it must update the last_login_date properly", async () => {
        const currentUser: Result_4 = await actorOne.get_current_user();
        expect(currentUser).toHaveProperty('Ok');

        const resultUpdatedUser: Result_4 = await actorOne.update_user_login_date();
        expect(resultUpdatedUser).toHaveProperty('Ok');
        expect(Object.keys(resultUpdatedUser['Ok'])).toHaveLength(11);
        expect(resultUpdatedUser['Ok'].id).toStrictEqual(currentUser['Ok'].id);
        expect(resultUpdatedUser['Ok'].user_type).toStrictEqual(currentUser['Ok'].user_type);
        expect(resultUpdatedUser['Ok'].name).toStrictEqual(currentUser['Ok'].name);
        expect(resultUpdatedUser['Ok'].email).toStrictEqual(currentUser['Ok'].email);
        expect(resultUpdatedUser['Ok'].secrets).toStrictEqual([]);
        expect(resultUpdatedUser['Ok'].policies).toStrictEqual([]);
        expect(resultUpdatedUser['Ok'].key_box).toStrictEqual([]);
        expect(resultUpdatedUser['Ok'].contacts).toStrictEqual([]);
        expect(resultUpdatedUser['Ok'].date_last_login).toHaveLength(1);
        expect(resultUpdatedUser['Ok'].date_last_login[0]).toBeGreaterThan(currentUser['Ok'].date_last_login[0]);
        expect(resultUpdatedUser['Ok'].date_created).toStrictEqual(currentUser['Ok'].date_created);
        expect(resultUpdatedUser['Ok'].date_modified).toBeGreaterThan(currentUser['Ok'].date_modified);

    }, 15000); // Set timeout

});

describe("USER - delete_user()", () => {
    test("it must delete a user properly", async () => {
        // Delete user
        let resultOne: Result = await actorOne.delete_user();
        expect(resultOne).toHaveProperty('Ok');

        // Delete user again, must fail
        resultOne = await actorOne.delete_user();
        expect(resultOne).toHaveProperty('Err');
        expect(resultOne['Err']).toHaveProperty('UserDeletionFailed');

        // Create same user again, must work because it has been deleted
        const addOrUpdateUserArgsOne: AddOrUpdateUserArgs = {
            name: ['Alice'],
            email: ['alice@ioloapp.io'],
            user_type: [{ 'Person' : null }],
        };
        const userOneAgain: Result_4 = await actorOne.create_user(addOrUpdateUserArgsOne);
        expect(userOneAgain).toHaveProperty('Ok');
        expect(userOneAgain['Ok'].id).toStrictEqual(identityOne.getPrincipal().toString());

        // Delete user
        let resultTwo: Result = await actorTwo.delete_user();
        expect(resultTwo).toHaveProperty('Ok');

        // Delete user
        let resultThree: Result = await actorThree.delete_user();
        expect(resultThree).toHaveProperty('Ok');

    }, 15000); // Set timeout
});