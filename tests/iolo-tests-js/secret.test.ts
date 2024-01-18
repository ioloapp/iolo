import {describe, expect, test} from 'vitest';
import {
    createIdentity,
    createNewActor,
    determineBackendCanisterId,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    AddSecretArgs,
    Result,
    SecretSymmetricCryptoMaterial
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {
    Result_1,
    Result_3,
    Result_6, Secret, Result_7
} from "../../.dfx/local/canisters/iolo_backend/service.did";
import {v4 as uuidv4} from 'uuid';
import  * as crypto from 'crypto';

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const actorOne = createNewActor(identityOne, canisterId);
const actorTwo = createNewActor(identityTwo, canisterId);

const symmetricCryptoMaterial: SecretSymmetricCryptoMaterial = {
    encrypted_symmetric_key: new TextEncoder().encode('mySuperKey'), // just a byte array, no symmetric key
    iv: crypto.getRandomValues(new Uint8Array(12)),  // Add arbitrary byte array
    notes_decryption_nonce: [crypto.getRandomValues(new Uint8Array(12))],  // Add arbitrary byte array
    password_decryption_nonce: [crypto.getRandomValues(new Uint8Array(12))],  // Add arbitrary byte array
    username_decryption_nonce: [crypto.getRandomValues(new Uint8Array(12))],  // Add arbitrary byte array
};
const secretOne: Secret = {
    id: uuidv4(),
    name: ['secretA'],
    url: ['https://urlOne'],
    category: [{'Password': null}],
    username: [new TextEncoder().encode('userOne')], // unencrypted byte array
    password: [new TextEncoder().encode('pwOne')], // unencrypted byte array
    notes: [new TextEncoder().encode('notesOne')], // unencrypted byte array
    date_created: BigInt(Date.now()),
    date_modified: BigInt(Date.now()),
};
const secretTwo: Secret = {
    id: uuidv4(),
    name: ['secretB'],
    url: ['https://urlTwo'],
    category: [{'Note': null}],
    username: [],
    password: [],
    notes: [new TextEncoder().encode('notesTwo')], // unencrypted byte array
    date_created: BigInt(Date.now()),
    date_modified: BigInt(Date.now()),
};
const secretThree: Secret = {
    id: uuidv4(),
    name: ['secretC'],
    url: [],
    category: [{'Document': null}],
    username: [],
    password: [],
    notes: [new TextEncoder().encode('notesThree')], // unencrypted byte array
    date_created: BigInt(Date.now()),
    date_modified: BigInt(Date.now()),
};
const secretFour: Secret = {
    id: uuidv4(),
    name: [],
    url: [],
    category: [],
    username: [],
    password: [],
    notes: [],
    date_created: BigInt(Date.now()),
    date_modified: BigInt(Date.now()),
};

let dateCreatedOne: bigint;
let dateModifiedOne: bigint;

/*
 NOTE: This test suite does only check the backend. It does not check the secret encryption/decryption.
       Therefore, only arbitrary byte arrays are used for username, password and notes and also for symmetricCryptoMaterial.
 */

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
        // Add secret one with identity one
        const addSecretArgsOne: AddSecretArgs = {
            id: secretOne.id,
            name: secretOne.name,
            url: secretOne.url,
            username: secretOne.username,
            password: secretOne.password,
            notes: secretOne.notes,
            category: secretOne.category,
            symmetric_crypto_material: symmetricCryptoMaterial,
        };

        const resultAddSecretOne: Result_1 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        expect(resultAddSecretOne['Ok'].id).not.toBe(secretOne.id);
        expect(resultAddSecretOne['Ok'].name).toStrictEqual(secretOne.name);
        expect(resultAddSecretOne['Ok'].url).toStrictEqual(secretOne.url);
        expect(resultAddSecretOne['Ok'].username).toStrictEqual(secretOne.username);
        expect(resultAddSecretOne['Ok'].password).toStrictEqual(secretOne.password);
        expect(resultAddSecretOne['Ok'].notes).toStrictEqual(secretOne.notes);
        expect(resultAddSecretOne['Ok'].category).toStrictEqual(secretOne.category);
        expect(resultAddSecretOne['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretOne['Ok'].date_created).toStrictEqual(resultAddSecretOne['Ok'].date_modified);
        secretOne.id = resultAddSecretOne['Ok'].id; // Overwrite id with correct value generated from backend
        dateCreatedOne = resultAddSecretOne['Ok'].date_created; // Store date created for later tests
        dateModifiedOne = resultAddSecretOne['Ok'].date_modified; // Store date modified for later tests

        // Add secret two with identity one
        const addSecretArgsTwo: AddSecretArgs = {
            id: secretTwo.id,
            name: secretTwo.name,
            url: secretTwo.url,
            username: secretTwo.username,
            password: secretTwo.password,
            notes: secretTwo.notes,
            category: secretTwo.category,
            symmetric_crypto_material: symmetricCryptoMaterial,
        };

        const resultAddSecretTwo: Result_1 = await actorOne.add_secret(addSecretArgsTwo);
        expect(resultAddSecretTwo).toHaveProperty('Ok');
        expect(resultAddSecretTwo['Ok'].id).not.toBe(secretTwo.id);
        expect(resultAddSecretTwo['Ok'].name).toStrictEqual(secretTwo.name);
        expect(resultAddSecretTwo['Ok'].url).toStrictEqual(secretTwo.url);
        expect(resultAddSecretTwo['Ok'].username).toStrictEqual(secretTwo.username);
        expect(resultAddSecretTwo['Ok'].password).toStrictEqual(secretTwo.password);
        expect(resultAddSecretTwo['Ok'].notes).toStrictEqual(secretTwo.notes);
        expect(resultAddSecretTwo['Ok'].category).toStrictEqual(secretTwo.category);
        expect(resultAddSecretTwo['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretTwo['Ok'].date_created).toStrictEqual(resultAddSecretTwo['Ok'].date_modified);
        secretTwo.id = resultAddSecretTwo['Ok'].id; // Overwrite id with correct value generated from backend

        // Add secret three with identity two
        const addSecretArgsThree: AddSecretArgs = {
            id: secretThree.id,
            name: secretThree.name,
            url: secretThree.url,
            username: secretThree.username,
            password: secretThree.password,
            notes: secretThree.notes,
            category: secretThree.category,
            symmetric_crypto_material: symmetricCryptoMaterial,
        };

        const resultAddSecretThree: Result_1 = await actorTwo.add_secret(addSecretArgsThree);
        expect(resultAddSecretThree).toHaveProperty('Ok');
        expect(resultAddSecretThree['Ok'].id).not.toBe(secretThree.id);
        expect(resultAddSecretThree['Ok'].name).toStrictEqual(secretThree.name);
        expect(resultAddSecretThree['Ok'].url).toStrictEqual(secretThree.url);
        expect(resultAddSecretThree['Ok'].username).toStrictEqual(secretThree.username);
        expect(resultAddSecretThree['Ok'].password).toStrictEqual(secretThree.password);
        expect(resultAddSecretThree['Ok'].notes).toStrictEqual(secretThree.notes);
        expect(resultAddSecretThree['Ok'].category).toStrictEqual(secretThree.category);
        expect(resultAddSecretThree['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretThree['Ok'].date_created).toStrictEqual(resultAddSecretThree['Ok'].date_modified);
        secretThree.id = resultAddSecretThree['Ok'].id; // Overwrite id with correct value generated from backend

        // Add secret four with identity two
        const addSecretArgsFour: AddSecretArgs = {
            id: secretFour.id,
            name: secretFour.name,
            url: secretFour.url,
            username: secretFour.username,
            password: secretFour.password,
            notes: secretFour.notes,
            category: secretFour.category,
            symmetric_crypto_material: symmetricCryptoMaterial,
        };

        const resultAddSecretFour: Result_1 = await actorTwo.add_secret(addSecretArgsFour);
        expect(resultAddSecretFour).toHaveProperty('Ok');
        expect(resultAddSecretFour['Ok'].id).not.toBe(secretFour.id);
        expect(resultAddSecretFour['Ok'].name).toStrictEqual(secretFour.name);
        expect(resultAddSecretFour['Ok'].url).toStrictEqual(secretFour.url);
        expect(resultAddSecretFour['Ok'].username).toStrictEqual(secretFour.username);
        expect(resultAddSecretFour['Ok'].password).toStrictEqual(secretFour.password);
        expect(resultAddSecretFour['Ok'].notes).toStrictEqual(secretFour.notes);
        expect(resultAddSecretFour['Ok'].category).toStrictEqual(secretFour.category);
        expect(resultAddSecretFour['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretFour['Ok'].date_created).toStrictEqual(resultAddSecretFour['Ok'].date_modified);
        secretFour.id = resultAddSecretFour['Ok'].id; // Overwrite id with correct value generated from backend

    }, 60000); // Set timeout

    test("it should create the same secret twice", async () => {

        // Adding a new secret with the same attributes must work
        // Add secret one with identity one
        const addSecretArgsOne: AddSecretArgs = {
            id: secretOne.id,
            name: secretOne.name,
            url: secretOne.url,
            username: secretOne.username,
            password: secretOne.password,
            notes: secretOne.notes,
            category: secretOne.category,
            symmetric_crypto_material: symmetricCryptoMaterial,
        };

        const resultAddSecretOne: Result_1 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        expect(resultAddSecretOne['Ok'].id).not.toBe(secretOne.id);

        // Delete it again
        const resultRemoveSecret: Result_3 = await actorOne.remove_secret(resultAddSecretOne['Ok'].id);
        expect(resultRemoveSecret).toHaveProperty('Ok');

    }, 15000); // Set timeout

    test("it should read secrets properly", async () => {
        // Check created secret via getSecret
        const resultSecretOne: Result_1 = await actorOne.get_secret(secretOne.id);
        expect(resultSecretOne).toHaveProperty('Ok');
        expect(resultSecretOne['Ok'].id).toStrictEqual(secretOne.id);
        expect(resultSecretOne['Ok'].name).toStrictEqual(secretOne.name);
        expect(resultSecretOne['Ok'].url).toStrictEqual(secretOne.url);
        expect(resultSecretOne['Ok'].username).toStrictEqual(secretOne.username);
        expect(resultSecretOne['Ok'].password).toStrictEqual(secretOne.password);
        expect(resultSecretOne['Ok'].notes).toStrictEqual(secretOne.notes);
        expect(resultSecretOne['Ok'].category).toStrictEqual(secretOne.category);
        expect(resultSecretOne['Ok'].date_created).toStrictEqual(dateCreatedOne);
        expect(resultSecretOne['Ok'].date_modified).toStrictEqual(dateModifiedOne);
        expect(resultSecretOne['Ok'].date_created).toStrictEqual(resultSecretOne['Ok'].date_modified);

        const resultSecretTwo: Result_1 = await actorOne.get_secret(secretTwo.id);
        expect(resultSecretTwo).toHaveProperty('Ok');
        // Only validate differences to secretOne
        expect(resultSecretTwo['Ok'].username).toStrictEqual([]);
        expect(resultSecretTwo['Ok'].password).toStrictEqual([]);
        expect(resultSecretTwo['Ok'].notes).toHaveLength(1);
        expect(resultSecretTwo['Ok'].category).toStrictEqual(secretTwo.category);

        const resultSecretThree: Result_1 = await actorTwo.get_secret(secretThree.id);
        expect(resultSecretThree).toHaveProperty('Ok');
        // Only validate differences to secretOne and secretTwo
        expect(resultSecretThree['Ok'].url).toStrictEqual([]);
        expect(resultSecretThree['Ok'].category).toStrictEqual(secretThree.category);

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
        expect(resultSecretListOne['Ok'][0].name).toStrictEqual(secretOne.name);
        expect(resultSecretListOne['Ok'][0].category).toStrictEqual(secretOne.category);
        expect(resultSecretListOne['Ok'][1].id).toStrictEqual(secretTwo.id);
        expect(resultSecretListOne['Ok'][1].name).toStrictEqual(secretTwo.name);
        expect(resultSecretListOne['Ok'][1].category).toStrictEqual(secretTwo.category);

        // Check created secret of identity two via getSecretList
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
        expect(resultSecretListTwo['Ok'][1].name).toStrictEqual(secretThree.name);
        expect(resultSecretListTwo['Ok'][1].category).toStrictEqual(secretThree.category);

    }, 10000); // Set timeout

    test("it should update secrets properly", async () => {
        // Update all possible attributes of a secret
        secretOne.name = ['myUpdatedSecretOne'];
        secretOne.url = ['https://myUpdatedUrlOne'];
        secretOne.category = [{'Note': null}];
        secretOne.username = [new TextEncoder().encode('myUpdatedUsernameOne')];
        secretOne.password = [new TextEncoder().encode('myUpdatedPasswordOne')];
        secretOne.notes = [new TextEncoder().encode('myUpdatedNotesOne')];
        secretOne.date_modified = BigInt(Date.now()); // Must not be updated
        secretOne.date_created = BigInt(Date.now()); // Must not be updated

        const resultUpdateSecretOne: Result_1 = await actorOne.update_secret(secretOne);
        expect(resultUpdateSecretOne).toHaveProperty('Ok');
        expect(resultUpdateSecretOne['Ok'].id).toStrictEqual(secretOne.id);
        expect(resultUpdateSecretOne['Ok'].name).toStrictEqual(secretOne.name);
        expect(resultUpdateSecretOne['Ok'].url).toStrictEqual(secretOne.url);
        expect(resultUpdateSecretOne['Ok'].username).toStrictEqual(secretOne.username);
        expect(resultUpdateSecretOne['Ok'].password).toStrictEqual(secretOne.password);
        expect(resultUpdateSecretOne['Ok'].notes).toStrictEqual(secretOne.notes);
        expect(resultUpdateSecretOne['Ok'].category).toStrictEqual(secretOne.category);
        expect(resultUpdateSecretOne['Ok'].date_modified).not.toBe(secretOne.date_modified);
        expect(resultUpdateSecretOne['Ok'].date_modified).toBeGreaterThan(dateModifiedOne);
        expect(resultUpdateSecretOne['Ok'].date_created).not.toBe(secretOne.date_created);
        expect(resultUpdateSecretOne['Ok'].date_created).toStrictEqual(dateCreatedOne);

        // Remove attributes that have been existing before and add attributes that have not been existing before
        secretTwo.name = ['myUpdatedSecretTwo'];
        secretTwo.url = []; // remove url
        secretTwo.notes = []; // remove notes
        secretTwo.password = [new TextEncoder().encode('myUpdatedPasswordTwo')]; // add password
        secretTwo.username = [new TextEncoder().encode('myUpdatedUsernameTwo')]; // add username

        const resultUpdateSecretTwo: Result_1 = await actorOne.update_secret(secretTwo);
        expect(resultUpdateSecretTwo).toHaveProperty('Ok');
        // Only validate updated attributes
        expect(resultUpdateSecretTwo['Ok'].url).toStrictEqual([]);
        expect(resultUpdateSecretTwo['Ok'].username).toStrictEqual(secretTwo.username);
        expect(resultUpdateSecretTwo['Ok'].password).toStrictEqual(secretTwo.password);
        expect(resultUpdateSecretTwo['Ok'].notes).toStrictEqual([]);

    }, 15000); // Set timeout

    test("it must not update secrets of a different user", async () => {
        // Update secret
        const resultUpdateSecretOne: Result_1 = await actorTwo.update_secret(secretOne);
        expect(resultUpdateSecretOne).toHaveProperty('Err');
        expect(resultUpdateSecretOne['Err']).toHaveProperty('SecretDoesNotExist');
    }, 15000); // Set timeout

    test("it should read the secret symmetric crypto material properly", async () => {
        // Add secret one with identity one
        const addSecretArgsOne: AddSecretArgs = {
            id: secretOne.id,
            name: secretOne.name,
            url: secretOne.url,
            username: secretOne.username,
            password: secretOne.password,
            notes: secretOne.notes,
            category: secretOne.category,
            symmetric_crypto_material: symmetricCryptoMaterial,
        };

        const resultAddSecretOne: Result_1 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');

        const resultSecretSymmetricCryptoMaterialOne: Result_7 = await actorOne.get_secret_symmetric_crypto_material(secretOne.id);
        expect(resultSecretSymmetricCryptoMaterialOne).toHaveProperty('Ok');
        expect(resultSecretSymmetricCryptoMaterialOne['Ok'].iv).toStrictEqual(symmetricCryptoMaterial.iv);
        expect(resultSecretSymmetricCryptoMaterialOne['Ok'].encrypted_symmetric_key).toStrictEqual(symmetricCryptoMaterial.encrypted_symmetric_key);
        expect(resultSecretSymmetricCryptoMaterialOne['Ok'].notes_decryption_nonce).toStrictEqual(symmetricCryptoMaterial.notes_decryption_nonce);
        expect(resultSecretSymmetricCryptoMaterialOne['Ok'].password_decryption_nonce).toStrictEqual(symmetricCryptoMaterial.password_decryption_nonce);
        expect(resultSecretSymmetricCryptoMaterialOne['Ok'].username_decryption_nonce).toStrictEqual(symmetricCryptoMaterial.username_decryption_nonce);


    }, 15000); // Set timeout

    test("it should delete secrets properly", async () => {
        // Deleting secretOne with userOne must work
        const resultRemoveSecretOne: Result_3 = await actorOne.remove_secret(secretOne.id);
        expect(resultRemoveSecretOne).toHaveProperty('Ok');
        expect(resultRemoveSecretOne['Ok']).toBeNull();

    }, 15000); // Set timeout

    test("it must not delete secrets of a different user", async () => {
        // Deleting secretThree with userOne must not work
        const resultRemoveSecretThree: Result_3 = await actorOne.remove_secret(secretThree.id);
        expect(resultRemoveSecretThree).toHaveProperty('Err');
        expect(resultRemoveSecretThree['Err']).toHaveProperty('SecretDoesNotExist');

    }, 15000); // Set timeout
});