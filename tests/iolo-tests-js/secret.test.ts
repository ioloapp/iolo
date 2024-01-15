import {describe, expect, test} from 'vitest';
import {
    createIdentity,
    createNewActor,
    createAddSecretArgs,
    determineBackendCanisterId, decryptSecret, mapToSecretCategory, mapToUiSecretCategory,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {AddSecretArgs, Result} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {
    Result_1,
    Result_3,
    Result_6, Secret,
} from "../../.dfx/local/canisters/iolo_backend/service.did";
import {v4 as uuidv4} from 'uuid';
import {UiSecret, UiSecretCategory} from "../../src/iolo_frontend/src/services/IoloTypesForUi";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const actorOne = createNewActor(identityOne, canisterId);
const actorTwo = createNewActor(identityTwo, canisterId);

const secretId = uuidv4();
const secretOne: UiSecret = {
    id: secretId,
    name: 'secretA',
    url: 'https://urlOne',
    category: UiSecretCategory.Password,
    username: 'userOne',
    password: 'pwOne',
    notes: 'notesOne',
};
const secretTwo: UiSecret = {
    id: secretId,
    name: 'secretB',
    url: 'https://urlTwo',
    category: UiSecretCategory.Note,
    notes: 'notesTwo',
};
const secretThree: UiSecret = {
    id: secretId,
    name: 'secretC',
    category: UiSecretCategory.Document,
    notes: 'notesThree',
};
const secretFour: UiSecret = {
    id: secretId,
};
let usernameOneEncrypted: Uint8Array;
let passwordOneEncrypted: Uint8Array;
let notesOneEncrypted: Uint8Array;
let dateCreatedOne: bigint;
let dateModifiedOne: bigint;


describe("Secret Tests", () => {
    test("it should create a uservault", async () => {
        const addUserOneArgs = {
            id: createIdentity().getPrincipal(),
            name: ['Alice'],
            email: ['alice@ioloapp.io'],
            user_type: [{ 'Person' : null }],
        };
        const resultCreateUserOne: Result = await actorOne.create_user(addUserOneArgs);
        expect(resultCreateUserOne).toHaveProperty('Ok');

        const addUserTwoArgs = {
            id: createIdentity().getPrincipal(),
            name: ['Bob'],
            email: ['bob@ioloapp.io'],
            user_type: [{ 'Person' : null }],
        };
        const resultCreateUserTwo: Result = await actorTwo.create_user(addUserTwoArgs);
        expect(resultCreateUserTwo).toHaveProperty('Ok');

    }, 10000); // Set timeout

    test("it should create secrets properly", async () => {
        // Add secrets
        const addSecretArgsOne: AddSecretArgs = await createAddSecretArgs(actorOne, secretOne);
        usernameOneEncrypted = addSecretArgsOne.username[0] as Uint8Array; // Store encrypted values for later tests
        passwordOneEncrypted = addSecretArgsOne.password[0] as Uint8Array; // Store encrypted values for later tests
        notesOneEncrypted = addSecretArgsOne.notes[0] as Uint8Array; // Store encrypted values for later tests

        // Add secret one with identity one
        const resultAddSecretOne: Result_1 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        expect(resultAddSecretOne['Ok'].id).not.toBe(secretOne.id);
        expect(resultAddSecretOne['Ok'].name).toStrictEqual([secretOne.name]);
        expect(resultAddSecretOne['Ok'].url).toStrictEqual([secretOne.url]);
        expect(resultAddSecretOne['Ok'].username).toStrictEqual(addSecretArgsOne.username);
        expect(resultAddSecretOne['Ok'].password).toStrictEqual(addSecretArgsOne.password);
        expect(resultAddSecretOne['Ok'].notes).toStrictEqual(addSecretArgsOne.notes);
        expect(resultAddSecretOne['Ok'].category).toStrictEqual(addSecretArgsOne.category);
        expect(resultAddSecretOne['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretOne['Ok'].date_created).toStrictEqual(resultAddSecretOne['Ok'].date_modified);
        const decryptedSecretOne = await decryptSecret(actorOne, resultAddSecretOne['Ok']);
        expect(decryptedSecretOne.username).toStrictEqual(secretOne.username); // Check decrypted values
        expect(decryptedSecretOne.password).toStrictEqual(secretOne.password); // Check decrypted values
        expect(decryptedSecretOne.notes).toStrictEqual(secretOne.notes); // Check decrypted values
        secretOne.id = resultAddSecretOne['Ok'].id; // Overwrite id with correct value generated from backend
        dateCreatedOne = resultAddSecretOne['Ok'].date_created; // Store date created for later tests
        dateModifiedOne = resultAddSecretOne['Ok'].date_modified; // Store date modified for later tests

        // Add secret two with identity one
        const addSecretArgsTwo: AddSecretArgs = await createAddSecretArgs(actorOne, secretTwo);
        const resultAddSecretTwo: Result_1 = await actorOne.add_secret(addSecretArgsTwo);
        expect(resultAddSecretTwo).toHaveProperty('Ok');
        expect(resultAddSecretTwo['Ok'].id).not.toBe(secretTwo.id);
        expect(resultAddSecretTwo['Ok'].name).toStrictEqual([secretTwo.name]);
        expect(resultAddSecretTwo['Ok'].url).toStrictEqual([secretTwo.url]);
        expect(resultAddSecretTwo['Ok'].username).toStrictEqual(addSecretArgsTwo.username);
        expect(resultAddSecretTwo['Ok'].password).toStrictEqual(addSecretArgsTwo.password);
        expect(resultAddSecretTwo['Ok'].notes).toStrictEqual(addSecretArgsTwo.notes);
        expect(resultAddSecretTwo['Ok'].category).toStrictEqual(addSecretArgsTwo.category);
        expect(resultAddSecretTwo['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretTwo['Ok'].date_created).toStrictEqual(resultAddSecretTwo['Ok'].date_modified);
        secretTwo.id = resultAddSecretTwo['Ok'].id; // Overwrite id with correct value generated from backend

        // Add secret three with identity two
        const addSecretArgsThree: AddSecretArgs = await createAddSecretArgs(actorTwo, secretThree);
        const resultAddSecretThree: Result_1 = await actorTwo.add_secret(addSecretArgsThree);
        expect(resultAddSecretThree).toHaveProperty('Ok');
        expect(resultAddSecretThree['Ok'].id).not.toBe(secretThree.id);
        expect(resultAddSecretThree['Ok'].name).toStrictEqual([secretThree.name]);
        expect(resultAddSecretThree['Ok'].url).toStrictEqual([]);
        expect(resultAddSecretThree['Ok'].username).toStrictEqual(addSecretArgsThree.username);
        expect(resultAddSecretThree['Ok'].password).toStrictEqual(addSecretArgsThree.password);
        expect(resultAddSecretThree['Ok'].notes).toStrictEqual(addSecretArgsThree.notes);
        expect(resultAddSecretThree['Ok'].category).toStrictEqual(addSecretArgsThree.category);
        expect(resultAddSecretThree['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretThree['Ok'].date_created).toStrictEqual(resultAddSecretThree['Ok'].date_modified);
        secretThree.id = resultAddSecretThree['Ok'].id; // Overwrite id with correct value generated from backend

        // Add secret four with identity two
        const addSecretArgsFour: AddSecretArgs = await createAddSecretArgs(actorTwo, secretFour);
        const resultAddSecretFour: Result_1 = await actorTwo.add_secret(addSecretArgsFour);
        expect(resultAddSecretFour).toHaveProperty('Ok');
        expect(resultAddSecretFour['Ok'].id).not.toBe(secretFour.id);
        expect(resultAddSecretFour['Ok'].name).toStrictEqual([]);
        expect(resultAddSecretFour['Ok'].url).toStrictEqual([]);
        expect(resultAddSecretFour['Ok'].username).toStrictEqual([]);
        expect(resultAddSecretFour['Ok'].password).toStrictEqual([]);
        expect(resultAddSecretFour['Ok'].notes).toStrictEqual([]);
        expect(resultAddSecretFour['Ok'].category).toStrictEqual([]);
        expect(resultAddSecretFour['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretFour['Ok'].date_created).toStrictEqual(resultAddSecretFour['Ok'].date_modified);
        secretFour.id = resultAddSecretFour['Ok'].id; // Overwrite id with correct value generated from backend

    }, 60000); // Set timeout

    test("it should create the same secret twice", async () => {

        // Adding a new secret with the same attributes must work
        const addSecretArgsOne: AddSecretArgs = await createAddSecretArgs(actorOne, secretOne);
        const resultAddSecretOne = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');

        // Delete it again
        const resultRemoveSecret: Result_3 = await actorOne.remove_secret(resultAddSecretOne['Ok'].id);
        expect(resultRemoveSecret).toHaveProperty('Ok');

    }, 15000); // Set timeout

    test("it should read secrets properly", async () => {
        // Check created secret via getSecret
        const resultSecretOne: Result_1 = await actorOne.get_secret(secretOne.id);
        expect(resultSecretOne).toHaveProperty('Ok');
        expect(resultSecretOne['Ok'].id).toStrictEqual(secretOne.id);
        expect(resultSecretOne['Ok'].name).toStrictEqual([secretOne.name]);
        expect(resultSecretOne['Ok'].url).toStrictEqual([secretOne.url]);
        expect(resultSecretOne['Ok'].username).toStrictEqual([usernameOneEncrypted]);
        expect(resultSecretOne['Ok'].password).toStrictEqual([passwordOneEncrypted]);
        expect(resultSecretOne['Ok'].notes).toStrictEqual([notesOneEncrypted]);
        expect(resultSecretOne['Ok'].category).toStrictEqual([mapToSecretCategory(secretOne.category)]);
        expect(resultSecretOne['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultSecretOne['Ok'].date_created).toStrictEqual(resultSecretOne['Ok'].date_modified);
        const decryptedSecretOne = await decryptSecret(actorOne, resultSecretOne['Ok']);
        expect(decryptedSecretOne.username).toStrictEqual(secretOne.username); // Check decrypted values
        expect(decryptedSecretOne.password).toStrictEqual(secretOne.password); // Check decrypted values
        expect(decryptedSecretOne.notes).toStrictEqual(secretOne.notes); // Check decrypted values

        const resultSecretTwo: Result_1 = await actorOne.get_secret(secretTwo.id);
        expect(resultSecretTwo).toHaveProperty('Ok');
        // Only validate differences to secretOne
        expect(resultSecretTwo['Ok'].username).toStrictEqual([]);
        expect(resultSecretTwo['Ok'].password).toStrictEqual([]);
        expect(resultSecretTwo['Ok'].notes).toHaveLength(1);
        expect(resultSecretTwo['Ok'].category).toStrictEqual([mapToSecretCategory(secretTwo.category)]);

        const resultSecretThree: Result_1 = await actorTwo.get_secret(secretThree.id);
        expect(resultSecretThree).toHaveProperty('Ok');
        // Only validate differences to secretOne and secretTwo
        expect(resultSecretThree['Ok'].url).toStrictEqual([]);
        expect(resultSecretThree['Ok'].category).toStrictEqual([mapToSecretCategory(secretThree.category)]);

        const resultSecretFour: Result_1 = await actorTwo.get_secret(secretFour.id);
        expect(resultSecretFour).toHaveProperty('Ok');
        // Only validate differences to secretOne, secretTwo and secretThree
        expect(resultSecretFour['Ok'].name).toStrictEqual([]);
        expect(resultSecretFour['Ok'].category).toStrictEqual([]);
        expect(resultSecretFour['Ok'].notes).toStrictEqual([]);

    }, 30000); // Set timeout

    test("it must not read secrets from other users", async () => {
        // Check created secret via getSecret
        const resultSecretOne: Result_1 = await actorOne.get_secret(secretThree.id);
        expect(resultSecretOne).toHaveProperty('Err');
        expect(resultSecretOne['Err']).toHaveProperty('SecretDoesNotExist');

    }, 30000); // Set timeout

    test("it should read the secret list properly", async () => {
        // Check created secret of identity one via getSecretList
        const resultSecretListOne: Result_6 = await actorOne.get_secret_list();
        expect(resultSecretListOne).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretListOne['Ok'])).toBe(true);
        // Sort the list by name
        resultSecretListOne['Ok'].sort((a, b) => {
            const nameA = a.name.length > 0 ? a.name[0] : '';
            const nameB = b.name.length > 0 ? b.name[0] : '';
            return nameA.localeCompare(nameB);
        });
        expect(resultSecretListOne['Ok']).toHaveLength(2);
        expect(resultSecretListOne['Ok'][0].id).toStrictEqual(secretOne.id);
        expect(resultSecretListOne['Ok'][0].name).toStrictEqual([secretOne.name]);
        expect(resultSecretListOne['Ok'][0].category).toStrictEqual([mapToSecretCategory(secretOne.category)]);
        expect(resultSecretListOne['Ok'][1].id).toStrictEqual(secretTwo.id);
        expect(resultSecretListOne['Ok'][1].name).toStrictEqual([secretTwo.name]);
        expect(resultSecretListOne['Ok'][1].category).toStrictEqual([mapToSecretCategory(secretTwo.category)]);

        // Check created secret of identity one via getSecretList
        const resultSecretListTwo: Result_6 = await actorTwo.get_secret_list();
        expect(resultSecretListTwo).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretListTwo['Ok'])).toBe(true);
        // Sort the list by name
        resultSecretListTwo['Ok'].sort((a, b) => {
            const nameA = a.name.length > 0 ? a.name[0] : '';
            const nameB = b.name.length > 0 ? b.name[0] : '';
            return nameA.localeCompare(nameB);
        });
        expect(resultSecretListTwo['Ok']).toHaveLength(2);
        expect(resultSecretListTwo['Ok'][0].id).toStrictEqual(secretFour.id);
        expect(resultSecretListTwo['Ok'][0].name).toStrictEqual([]);
        expect(resultSecretListTwo['Ok'][0].category).toStrictEqual([]);
        expect(resultSecretListTwo['Ok'][1].id).toStrictEqual(secretThree.id);
        expect(resultSecretListTwo['Ok'][1].name).toStrictEqual([secretThree.name]);
        expect(resultSecretListTwo['Ok'][1].category).toStrictEqual([mapToSecretCategory(secretThree.category)]);

    }, 10000); // Set timeout

    test("it should update secrets properly", async () => {
        // Update secret
        secretOne.name = 'myUpdatedSecretOne';
        secretOne.url = 'https://myUpdatedUrlOne';
        secretOne.category = UiSecretCategory.Note;
        secretOne.username = 'myUpdatedUsernameOne';
        secretOne.password = 'myUpdatedPasswordOne';
        secretOne.notes = 'myUpdatedNotesOne';
        const addSecretArgs: AddSecretArgs = await createAddSecretArgs(actorOne, secretOne);
        const secretOneUpdate: Secret = {
            id: secretOne.id,
            name: addSecretArgs.name,
            url: addSecretArgs.url,
            username: addSecretArgs.username,
            password: addSecretArgs.password,
            notes: addSecretArgs.notes,
            category: addSecretArgs.category,
            date_modified: BigInt(Date.now()), // Should not be updatable
            date_created: BigInt(Date.now()),  // Should not be updatable
        };

        const resultUpdateSecretOne: Result_1 = await actorOne.update_secret(secretOneUpdate);
        expect(resultUpdateSecretOne).toHaveProperty('Ok');
        expect(resultUpdateSecretOne['Ok'].id).toStrictEqual(secretOne.id);
        expect(resultUpdateSecretOne['Ok'].name).toStrictEqual([secretOne.name]);
        expect(resultUpdateSecretOne['Ok'].url).toStrictEqual([secretOne.url]);
        expect(resultUpdateSecretOne['Ok'].username).toStrictEqual(addSecretArgs.username);
        expect(resultUpdateSecretOne['Ok'].password).toStrictEqual(addSecretArgs.password);
        expect(resultUpdateSecretOne['Ok'].notes).toStrictEqual(addSecretArgs.notes);
        expect(resultUpdateSecretOne['Ok'].category).toStrictEqual([mapToSecretCategory(secretOne.category)]);
        expect(resultUpdateSecretOne['Ok'].date_modified).not.toBe(secretOneUpdate.date_modified);
        expect(resultUpdateSecretOne['Ok'].date_modified).toBeGreaterThan(dateModifiedOne);
        expect(resultUpdateSecretOne['Ok'].date_created).not.toBe(secretOneUpdate.date_created);
        expect(resultUpdateSecretOne['Ok'].date_created).toStrictEqual(dateCreatedOne);
        const decryptedSecretOne = await decryptSecret(actorOne, resultUpdateSecretOne['Ok']);
        expect(decryptedSecretOne.username).toStrictEqual(secretOne.username); // Check decrypted values
        expect(decryptedSecretOne.password).toStrictEqual(secretOne.password); // Check decrypted values
        expect(decryptedSecretOne.notes).toStrictEqual(secretOne.notes); // Check decrypted values

    }, 15000); // Set timeout

    test("it must not update a secret of a different user", async () => {
        // Update secret
        secretOne.name = 'myUpdatedSecretOne';
        const addSecretArgs: AddSecretArgs = await createAddSecretArgs(actorOne, secretOne);
        const secretOneUpdate: Secret = {
            id: secretOne.id,
            name: addSecretArgs.name,
            url: addSecretArgs.url,
            username: addSecretArgs.username,
            password: addSecretArgs.password,
            notes: addSecretArgs.notes,
            category: addSecretArgs.category,
            date_modified: BigInt(Date.now()), // Should not be updatable
            date_created: BigInt(Date.now()),  // Should not be updatable
        };

        const resultUpdateSecretOne: Result_1 = await actorTwo.update_secret(secretOneUpdate);
        expect(resultUpdateSecretOne).toHaveProperty('Err');
        expect(resultUpdateSecretOne['Err']).toHaveProperty('SecretDoesNotExist');
    }, 15000); // Set timeout

    test("it should read the secret symmetric crypto material properly", async () => {

    }, 15000); // Set timeout
    /*test("it should delete secrets properly", async () => {
        // TODO
    }, 15000); // Set timeout*/
});