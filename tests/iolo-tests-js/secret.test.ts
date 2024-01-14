import {describe, expect, test} from 'vitest';
import {
    createIdentity,
    createNewActor,
    createAddSecretArgs,
    determineBackendCanisterId, decryptSecret, mapToSecretCategory,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {AddSecretArgs, Result} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {
    Result_1,
    Result_3,
    Result_6,
} from "../../.dfx/local/canisters/iolo_backend/service.did";
import {v4 as uuidv4} from 'uuid';
import {UiSecret, UiSecretCategory} from "../../src/iolo_frontend/src/services/IoloTypesForUi";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with user.test.ts which is running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const actorOne = createNewActor(identityOne, canisterId);

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


describe("Secret Tests", () => {
    test("it should create a uservault", async () => {
        const resultDeleteUserOne: Result_3 = await actorOne.delete_user(); // Just in case the user is already existing on the replica
        const addUserArgs = {
            id: createIdentity().getPrincipal(),
            name: ['Alice'],
            email: ['alice@ioloapp.io'],
            user_type: [{ 'Person' : null }],
        };
        const resultCreateUserOne: Result = await actorOne.create_user(addUserArgs);
        expect(resultCreateUserOne).toHaveProperty('Ok');

        // Create an uservault
        const hasVault: boolean = await actorOne.is_user_vault_existing();
        expect(hasVault).toBe(true)

    }, 10000); // Set timeout

    test("it should create secrets properly", async () => {
        // Check that no secret exists
        const resultSecretList: Result_6 = await actorOne.get_secret_list();
        expect(resultSecretList).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretList['Ok'])).toBe(true);
        expect(resultSecretList['Ok']).toHaveLength(0);

        // Add secrets
        const addSecretArgsOne: AddSecretArgs = await createAddSecretArgs(actorOne, secretOne);
        usernameOneEncrypted = addSecretArgsOne.username[0] as Uint8Array; // Store encrypted values for later tests
        passwordOneEncrypted = addSecretArgsOne.password[0] as Uint8Array; // Store encrypted values for later tests
        notesOneEncrypted = addSecretArgsOne.notes[0] as Uint8Array; // Store encrypted values for later tests

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

        const addSecretArgsThree: AddSecretArgs = await createAddSecretArgs(actorOne, secretThree);
        const resultAddSecretThree: Result_1 = await actorOne.add_secret(addSecretArgsThree);
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

        const addSecretArgsFour: AddSecretArgs = await createAddSecretArgs(actorOne, secretFour);
        const resultAddSecretFour: Result_1 = await actorOne.add_secret(addSecretArgsFour);
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

        const resultSecretThree: Result_1 = await actorOne.get_secret(secretThree.id);
        expect(resultSecretThree).toHaveProperty('Ok');
        // Only validate differences to secretOne and secretTwo
        expect(resultSecretThree['Ok'].url).toStrictEqual([]);
        expect(resultSecretThree['Ok'].category).toStrictEqual([mapToSecretCategory(secretThree.category)]);

        const resultSecretFour: Result_1 = await actorOne.get_secret(secretFour.id);
        expect(resultSecretFour).toHaveProperty('Ok');
        // Only validate differences to secretOne, secretTwo and secretThree
        expect(resultSecretFour['Ok'].name).toStrictEqual([]);
        expect(resultSecretFour['Ok'].category).toStrictEqual([]);
        expect(resultSecretFour['Ok'].notes).toStrictEqual([]);

    }, 30000); // Set timeout

    test("it should read the secret list properly", async () => {
        // Check created secret via getSecretList
        const resultSecretList: Result_6 = await actorOne.get_secret_list();
        expect(resultSecretList).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretList['Ok'])).toBe(true);
        // Sort the list by name
        resultSecretList['Ok'].sort((a, b) => {
            const nameA = a.name.length > 0 ? a.name[0] : '';
            const nameB = b.name.length > 0 ? b.name[0] : '';
            return nameA.localeCompare(nameB);
        });
        expect(resultSecretList['Ok']).toHaveLength(4);
        expect(resultSecretList['Ok'][0].id).toStrictEqual(secretFour.id);
        expect(resultSecretList['Ok'][0].name).toStrictEqual([]);
        expect(resultSecretList['Ok'][0].category).toStrictEqual([]);
        expect(resultSecretList['Ok'][1].id).toStrictEqual(secretOne.id);
        expect(resultSecretList['Ok'][1].name).toStrictEqual([secretOne.name]);
        expect(resultSecretList['Ok'][1].category).toStrictEqual([mapToSecretCategory(secretOne.category)]);
        expect(resultSecretList['Ok'][2].id).toStrictEqual(secretTwo.id);
        expect(resultSecretList['Ok'][2].name).toStrictEqual([secretTwo.name]);
        expect(resultSecretList['Ok'][2].category).toStrictEqual([mapToSecretCategory(secretTwo.category)]);
        expect(resultSecretList['Ok'][3].id).toStrictEqual(secretThree.id);
        expect(resultSecretList['Ok'][3].name).toStrictEqual([secretThree.name]);
        expect(resultSecretList['Ok'][3].category).toStrictEqual([mapToSecretCategory(secretThree.category)]);

    }, 10000); // Set timeout

    /*test("it should update secrets properly", async () => {
        // Update secret
        addSecretArgsOne.name = ['myUpdatedSuperSecretOne'];
        addSecretArgsOne.url = ['https://myUpdatedSuperUrlOne'];

        // Delete secrets again for following tests
        const resultRemoveSecretOne: Result_3 = await actorOne.remove_secret(addSecretArgsOne.id);
        expect(resultRemoveSecretOne).toHaveProperty('Ok');

    }, 15000); // Set timeout to 15s

    test("it should delete secrets properly", async () => {
        // TODO
    }, 15000); // Set timeout to 15s*/
});