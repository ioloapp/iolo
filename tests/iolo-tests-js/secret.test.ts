import {beforeAll, describe, expect, test} from 'vitest';
import {
    createIoloUsersInBackend,
    createIdentity,
    createNewActor,
    determineBackendCanisterId,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    AddSecretArgs,
    Result_3,
    Secret,
    Result_11, Result_7, Result_2, UpdateSecretArgs, _SERVICE
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {ActorSubclass} from "@dfinity/agent";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const actorOne: ActorSubclass<_SERVICE> = createNewActor(identityOne, canisterId);
const actorTwo: ActorSubclass<_SERVICE> = createNewActor(identityTwo, canisterId);

const encrypted_symmetric_key = new TextEncoder().encode('mySuperKey'); // just a byte array, no symmetric key

const addSecretArgsOne: AddSecretArgs = {
    name: ['secretA'],
    url: ['https://urlOne'],
    category: [{'Password': null}],
    username: [new TextEncoder().encode('userOne')], // arbitrary byte array
    password: [new TextEncoder().encode('pwOne')], // arbitrary byte array
    notes: [new TextEncoder().encode('notesOne')], // arbitrary byte array
    encrypted_symmetric_key: encrypted_symmetric_key,
};
const addSecretArgsTwo: AddSecretArgs = {
    name: ['secretB'],
    url: ['https://urlTwo'],
    category: [{'Note': null}],
    username: [],
    password: [],
    notes: [new TextEncoder().encode('notesTwo')], // arbitrary byte array
    encrypted_symmetric_key: encrypted_symmetric_key,
};
const addSecretArgsThree: AddSecretArgs = {
    name: ['secretC'],
    url: [],
    category: [{'Document': null}],
    username: [],
    password: [],
    notes: [new TextEncoder().encode('notesThree')], // arbitrary byte array
    encrypted_symmetric_key: encrypted_symmetric_key,
};
const addSecretArgsFour: AddSecretArgs = {
    name: [],
    url: [],
    category: [],
    username: [],
    password: [],
    notes: [],
    encrypted_symmetric_key: encrypted_symmetric_key,
};

let secretOne: Secret = {
    category: undefined,
    name: undefined,
    notes: undefined,
    owner: undefined,
    password: undefined,
    url: undefined,
    username: undefined,
    id: null,
    date_created: undefined,
    date_modified: undefined
}; // For usage in later tests
let secretTwo: Secret = structuredClone(secretOne);  // byValue instead of byReference
let secretThree: Secret = structuredClone(secretOne); // byValue instead of byReference
let secretFour: Secret = structuredClone(secretOne); // byValue instead of byReference

/*
 This test suit tests all secret related methods of the backend canister.
 Focus is on the correct return types and the correct behavior of the methods.
 It does not check the secret encryption/decryption, therefore, only arbitrary byte arrays are used for username, password and notes and also for symmetricCryptoMaterial.
 */

beforeAll(async () => {
    await createIoloUsersInBackend([actorOne, actorTwo]);
});

describe("SECRET - create_secret()", () => {
    test("it must create secrets properly", async () => {
        const resultAddSecretOne: Result_2 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        expect(Object.keys(resultAddSecretOne['Ok']).length).toStrictEqual(10);
        expect(resultAddSecretOne['Ok'].id).not.toStrictEqual("");
        expect(resultAddSecretOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString());
        expect(resultAddSecretOne['Ok'].name).toStrictEqual(addSecretArgsOne.name);
        expect(resultAddSecretOne['Ok'].url).toStrictEqual(addSecretArgsOne.url);
        expect(resultAddSecretOne['Ok'].username).toStrictEqual(addSecretArgsOne.username);
        expect(resultAddSecretOne['Ok'].password).toStrictEqual(addSecretArgsOne.password);
        expect(resultAddSecretOne['Ok'].notes).toStrictEqual(addSecretArgsOne.notes);
        expect(resultAddSecretOne['Ok'].category).toStrictEqual(addSecretArgsOne.category);
        expect(resultAddSecretOne['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretOne['Ok'].date_created).toStrictEqual(resultAddSecretOne['Ok'].date_modified);
        secretOne = resultAddSecretOne['Ok']; // Overwrite id with correct value generated from backend

        const resultAddSecretTwo: Result_2 = await actorOne.add_secret(addSecretArgsTwo);
        expect(resultAddSecretTwo).toHaveProperty('Ok');
        expect(Object.keys(resultAddSecretTwo['Ok']).length).toStrictEqual(10);
        expect(resultAddSecretTwo['Ok'].id).not.toStrictEqual("");
        expect(resultAddSecretTwo['Ok'].id).not.toBe(secretOne.id);
        expect(resultAddSecretTwo['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString());
        expect(resultAddSecretTwo['Ok'].name).toStrictEqual(addSecretArgsTwo.name);
        expect(resultAddSecretTwo['Ok'].url).toStrictEqual(addSecretArgsTwo.url);
        expect(resultAddSecretTwo['Ok'].username).toStrictEqual(addSecretArgsTwo.username);
        expect(resultAddSecretTwo['Ok'].password).toStrictEqual(addSecretArgsTwo.password);
        expect(resultAddSecretTwo['Ok'].notes).toStrictEqual(addSecretArgsTwo.notes);
        expect(resultAddSecretTwo['Ok'].category).toStrictEqual(addSecretArgsTwo.category);
        expect(resultAddSecretTwo['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretTwo['Ok'].date_created).toStrictEqual(resultAddSecretTwo['Ok'].date_modified);
        secretTwo = resultAddSecretTwo['Ok']; // Overwrite id with correct value generated from backend

        const resultAddSecretThree: Result_2 = await actorTwo.add_secret(addSecretArgsThree);
        expect(resultAddSecretThree).toHaveProperty('Ok');
        expect(Object.keys(resultAddSecretThree['Ok']).length).toStrictEqual(10);
        expect(resultAddSecretThree['Ok'].id).not.toStrictEqual("");
        expect(resultAddSecretThree['Ok'].id).not.toBe(secretOne.id);
        expect(resultAddSecretThree['Ok'].id).not.toBe(secretTwo.id);
        expect(resultAddSecretThree['Ok'].owner).toStrictEqual(identityTwo.getPrincipal().toString());
        expect(resultAddSecretThree['Ok'].name).toStrictEqual(addSecretArgsThree.name);
        expect(resultAddSecretThree['Ok'].url).toStrictEqual(addSecretArgsThree.url);
        expect(resultAddSecretThree['Ok'].username).toStrictEqual(addSecretArgsThree.username);
        expect(resultAddSecretThree['Ok'].password).toStrictEqual(addSecretArgsThree.password);
        expect(resultAddSecretThree['Ok'].notes).toStrictEqual(addSecretArgsThree.notes);
        expect(resultAddSecretThree['Ok'].category).toStrictEqual(addSecretArgsThree.category);
        expect(resultAddSecretThree['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretThree['Ok'].date_created).toStrictEqual(resultAddSecretThree['Ok'].date_modified);
        secretThree = resultAddSecretThree['Ok']; // Overwrite id with correct value generated from backend

        const resultAddSecretFour: Result_2 = await actorTwo.add_secret(addSecretArgsFour);
        expect(resultAddSecretFour).toHaveProperty('Ok');
        expect(Object.keys(resultAddSecretFour['Ok']).length).toStrictEqual(10);
        expect(resultAddSecretFour['Ok'].id).not.toStrictEqual("");
        expect(resultAddSecretFour['Ok'].id).not.toBe(secretOne.id);
        expect(resultAddSecretFour['Ok'].id).not.toBe(secretTwo.id);
        expect(resultAddSecretFour['Ok'].id).not.toBe(secretThree.id);
        expect(resultAddSecretFour['Ok'].owner).toStrictEqual(identityTwo.getPrincipal().toString());
        expect(resultAddSecretFour['Ok'].name).toStrictEqual(addSecretArgsFour.name);
        expect(resultAddSecretFour['Ok'].url).toStrictEqual(addSecretArgsFour.url);
        expect(resultAddSecretFour['Ok'].username).toStrictEqual(addSecretArgsFour.username);
        expect(resultAddSecretFour['Ok'].password).toStrictEqual(addSecretArgsFour.password);
        expect(resultAddSecretFour['Ok'].notes).toStrictEqual(addSecretArgsFour.notes);
        expect(resultAddSecretFour['Ok'].category).toStrictEqual(addSecretArgsFour.category);
        expect(resultAddSecretFour['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretFour['Ok'].date_created).toStrictEqual(resultAddSecretFour['Ok'].date_modified);
        secretFour = resultAddSecretFour['Ok']; // Overwrite id with correct value generated from backend

    }, 60000); // Set timeout

    test("it must create the same secret twice", async () => {
        // Adding a new secret with the same attributes must work
        const resultAddSecretOne: Result_2 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        expect(resultAddSecretOne['Ok'].id).not.toBe(secretOne.id);

        // Delete it again
        const resultRemoveSecretOne: Result_3 = await actorOne.remove_secret(resultAddSecretOne['Ok'].id);
        expect(resultRemoveSecretOne).toHaveProperty('Ok');

    }, 15000); // Set timeout

});

describe("SECRET - get_secret()", () => {
    test("it must read secrets properly", async () => {
        // Check created secret via getSecret
        const resultSecretOne: Result_2 = await actorOne.get_secret(secretOne.id);
        expect(resultSecretOne).toHaveProperty('Ok');
        expect(Object.keys(resultSecretOne['Ok']).length).toStrictEqual(10);
        expect(resultSecretOne['Ok'].id).toStrictEqual(secretOne.id);
        expect(resultSecretOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString());
        expect(resultSecretOne['Ok'].name).toStrictEqual(addSecretArgsOne.name);
        expect(resultSecretOne['Ok'].url).toStrictEqual(addSecretArgsOne.url);
        expect(resultSecretOne['Ok'].username).toStrictEqual(addSecretArgsOne.username);
        expect(resultSecretOne['Ok'].password).toStrictEqual(addSecretArgsOne.password);
        expect(resultSecretOne['Ok'].notes).toStrictEqual(addSecretArgsOne.notes);
        expect(resultSecretOne['Ok'].category).toStrictEqual(addSecretArgsOne.category);
        expect(resultSecretOne['Ok'].date_created).toStrictEqual(secretOne.date_created);
        expect(resultSecretOne['Ok'].date_modified).toStrictEqual(secretOne.date_modified);
        expect(resultSecretOne['Ok'].date_created).toStrictEqual(resultSecretOne['Ok'].date_modified);

        const resultSecretTwo: Result_2 = await actorOne.get_secret(secretTwo.id);
        expect(resultSecretTwo).toHaveProperty('Ok');
        // Only validate differences to secretOne
        expect(resultSecretTwo['Ok'].username).toStrictEqual([]);
        expect(resultSecretTwo['Ok'].password).toStrictEqual([]);
        expect(resultSecretTwo['Ok'].notes).toHaveLength(1);
        expect(resultSecretTwo['Ok'].category).toStrictEqual(addSecretArgsTwo.category);

        const resultSecretThree: Result_2 = await actorTwo.get_secret(secretThree.id);
        expect(resultSecretThree).toHaveProperty('Ok');
        // Only validate differences to secretOne and secretTwo
        expect(resultSecretThree['Ok'].url).toStrictEqual([]);
        expect(resultSecretThree['Ok'].category).toStrictEqual(addSecretArgsThree.category);

        const resultSecretFour: Result_2 = await actorTwo.get_secret(secretFour.id);
        expect(resultSecretFour).toHaveProperty('Ok');
        // Only validate differences to secretOne, secretTwo and secretThree
        expect(resultSecretFour['Ok'].name).toStrictEqual([]);
        expect(resultSecretFour['Ok'].category).toStrictEqual([]);
        expect(resultSecretFour['Ok'].notes).toStrictEqual([]);

    }, 30000); // Set timeout

    test("it must not read secrets from other users", async () => {
        // Check created secret via getSecret
        const resultSecretOne: Result_2 = await actorOne.get_secret(secretThree.id);
        expect(resultSecretOne).toHaveProperty('Err');
        expect(resultSecretOne['Err']).toHaveProperty('SecretDoesNotExist');

    }, 30000); // Set timeout
});

describe("SECRET - get_secret_list()", () => {
    test("it must read the secret list properly", async () => {

        // Check created secret of identity one via getSecretList
        const resultSecretListOne: Result_11 = await actorOne.get_secret_list();
        expect(resultSecretListOne).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretListOne['Ok'])).toBe(true);
        resultSecretListOne['Ok'].sort((a, b) => {
            const nameA = a.name.length > 0 ? a.name[0] : '';
            const nameB = b.name.length > 0 ? b.name[0] : '';
            return nameA.localeCompare(nameB);
        }); // Sort the list by name
        expect(resultSecretListOne['Ok']).toHaveLength(2);
        expect(resultSecretListOne['Ok'][0].id).toStrictEqual(secretOne.id);
        expect(resultSecretListOne['Ok'][0].name).toStrictEqual(addSecretArgsOne.name);
        expect(resultSecretListOne['Ok'][0].category).toStrictEqual(addSecretArgsOne.category);
        expect(resultSecretListOne['Ok'][1].id).toStrictEqual(secretTwo.id);
        expect(resultSecretListOne['Ok'][1].name).toStrictEqual(addSecretArgsTwo.name);
        expect(resultSecretListOne['Ok'][1].category).toStrictEqual(addSecretArgsTwo.category);

        // Check created secret of identity two via getSecretList
        const resultSecretListTwo: Result_11 = await actorTwo.get_secret_list();
        expect(resultSecretListTwo).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretListTwo['Ok'])).toBe(true);
        resultSecretListTwo['Ok'].sort((a, b) => {
            const nameA = a.name.length > 0 ? a.name[0] : '';
            const nameB = b.name.length > 0 ? b.name[0] : '';
            return nameA.localeCompare(nameB);
        }); // Sort the list by name
        expect(resultSecretListTwo['Ok']).toHaveLength(2);
        expect(resultSecretListTwo['Ok'][0].id).toStrictEqual(secretFour.id);
        expect(resultSecretListTwo['Ok'][0].name).toStrictEqual(addSecretArgsFour.name);
        expect(resultSecretListTwo['Ok'][0].category).toStrictEqual(addSecretArgsFour.category);
        expect(resultSecretListTwo['Ok'][1].id).toStrictEqual(secretThree.id);
        expect(resultSecretListTwo['Ok'][1].name).toStrictEqual(addSecretArgsThree.name);
        expect(resultSecretListTwo['Ok'][1].category).toStrictEqual(addSecretArgsThree.category);

    }, 10000); // Set timeout

});

describe("SECRET - update_secret()", () => {
    test("it must update secrets properly", async () => {
        let secretOneDateCreatedBeforeUpdate: bigint = secretOne.date_created;
        let secretOneDateModifiedBeforeUpdate: bigint = secretOne.date_modified;

        // Update all possible attributes of a secret
        let updateSecretArgsOne: UpdateSecretArgs = {
            category: [{'Note': null}],
            id: secretOne.id,
            name: ['myUpdatedSecretOne'],
            notes: [new TextEncoder().encode('myUpdatedNotesOne')],
            password: [new TextEncoder().encode('myUpdatedPasswordOne')],
            url: ['https://myUpdatedUrlOne'],
            username: [new TextEncoder().encode('myUpdatedUsernameOne')]
        };

        const resultUpdateSecretOne: Result_2 = await actorOne.update_secret(updateSecretArgsOne);
        expect(resultUpdateSecretOne).toHaveProperty('Ok');
        expect(resultUpdateSecretOne['Ok'].id).toStrictEqual(secretOne.id);
        expect(resultUpdateSecretOne['Ok'].name).toStrictEqual(updateSecretArgsOne.name);
        expect(resultUpdateSecretOne['Ok'].url).toStrictEqual(updateSecretArgsOne.url);
        expect(resultUpdateSecretOne['Ok'].username).toStrictEqual(updateSecretArgsOne.username);
        expect(resultUpdateSecretOne['Ok'].password).toStrictEqual(updateSecretArgsOne.password);
        expect(resultUpdateSecretOne['Ok'].notes).toStrictEqual(updateSecretArgsOne.notes);
        expect(resultUpdateSecretOne['Ok'].category).toStrictEqual(updateSecretArgsOne.category);
        expect(resultUpdateSecretOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString()); // Must not have changed
        expect(resultUpdateSecretOne['Ok'].date_modified).toBeGreaterThan(secretOneDateModifiedBeforeUpdate);
        expect(resultUpdateSecretOne['Ok'].date_created).toStrictEqual(secretOneDateCreatedBeforeUpdate); // Must not have changed

        // Remove attributes that have been existing before and add attributes that have not been existing before
        let updateSecretArgsTwo: UpdateSecretArgs = {
            category: secretTwo.category,
            id: secretTwo.id,
            name: secretTwo.name,
            notes: [], // remove notes
            url: [], // remove url
            password: [new TextEncoder().encode('myUpdatedPasswordTwo')], // add password
            username: [new TextEncoder().encode('myUpdatedUsernameTwo')] // add username
        };

        const resultUpdateSecretTwo: Result_2 = await actorOne.update_secret(updateSecretArgsTwo);
        expect(resultUpdateSecretTwo).toHaveProperty('Ok');
        // Only validate updated attributes
        expect(resultUpdateSecretTwo['Ok'].url).toStrictEqual([]);
        expect(resultUpdateSecretTwo['Ok'].username).toStrictEqual(updateSecretArgsTwo.username);
        expect(resultUpdateSecretTwo['Ok'].password).toStrictEqual(updateSecretArgsTwo.password);
        expect(resultUpdateSecretTwo['Ok'].notes).toStrictEqual([]);

        // Unknown secret id
        let updateSecretArgsThree: UpdateSecretArgs = {
            category: secretThree.category,
            id: "123456789",
            name: secretThree.name,
            notes: secretThree.notes,
            url: secretThree.url,
            password: secretThree.password,
            username: secretThree.username,
        };
        const resultUpdateSecretThree: Result_2 = await actorTwo.update_secret(updateSecretArgsThree);
        expect(resultUpdateSecretThree).toHaveProperty('Err');
        expect(resultUpdateSecretThree['Err']).toHaveProperty('SecretDoesNotExist');

    }, 15000); // Set timeout

    test("it must not update secrets of a different user", async () => {
        // Update secret
        const resultUpdateSecretOne: Result_2 = await actorTwo.update_secret(secretOne);
        expect(resultUpdateSecretOne).toHaveProperty('Err');
        expect(resultUpdateSecretOne['Err']).toHaveProperty('SecretDoesNotExist');
    }, 15000); // Set timeout

});

describe("SECRET - get_encrypted_symmetric_key()", () => {
    test("it must read the encrypted symmetric key properly", async () => {
        const resultEncryptedSymmetricKeyOne: Result_7 = await actorOne.get_encrypted_symmetric_key(secretOne.id);
        expect(resultEncryptedSymmetricKeyOne).toHaveProperty('Ok');
        expect(resultEncryptedSymmetricKeyOne['Ok']).toStrictEqual(encrypted_symmetric_key);
    }, 15000); // Set timeout

    test("it must not be possible to read the encrypted symmetric key from a different user", async () => {
        const resultEncryptedSecretKeyOne: Result_7 = await actorTwo.get_encrypted_symmetric_key(secretOne.id);
        expect(resultEncryptedSecretKeyOne).toHaveProperty('Err');
        expect(resultEncryptedSecretKeyOne['Err']).toHaveProperty('SecretDoesNotExist');
    }, 15000); // Set timeout

});

describe("SECRET - delete_secret()", () => {
    test("it must delete secrets properly", async () => {
        // Deleting secretOne with userOne must work
        const resultRemoveSecretOne: Result_3 = await actorOne.remove_secret(secretOne.id);
        expect(resultRemoveSecretOne).toHaveProperty('Ok');
        expect(resultRemoveSecretOne['Ok']).toBeNull();

        // Only one secret must exist in the backend now
        const resultSecretListOne: Result_11 = await actorOne.get_secret_list();
        expect(resultSecretListOne).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretListOne['Ok'])).toBe(true);
        expect(resultSecretListOne['Ok']).toHaveLength(1);

    }, 15000); // Set timeout

    test("it must not delete secrets of a different user", async () => {
        // Deleting secretThree with userOne must not work
        const resultRemoveSecretThree: Result_3 = await actorOne.remove_secret(secretThree.id);
        expect(resultRemoveSecretThree).toHaveProperty('Err');
        expect(resultRemoveSecretThree['Err']).toHaveProperty('SecretDoesNotExist');

    }, 15000); // Set timeout
});