import {describe, expect, test} from 'vitest';
import {
    createIdentity,
    createNewActor,
    createAddSecretArgs,
    determineBackendCanisterId, decryptSecret,
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
    name: 'secretOne',
    url: 'https://urlOne',
    category: UiSecretCategory.Password,
    username: 'userOne',
    password: 'pwOne',
    notes: 'notesOne',
};
const secretTwo: UiSecret = {
    id: secretId,
    name: 'secretTwo',
    url: 'https://urlTwo',
    category: UiSecretCategory.Note,
    notes: 'notesTwo',
};
const secretThree: UiSecret = {
    id: secretId,
    name: 'secretThree',
    url: 'https://urlThree',
    category: UiSecretCategory.Document,
    notes: 'notesTwo',
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

    }, 10000); // Set timeout to 10s

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
        const uiSecretOne = await decryptSecret(actorOne, resultAddSecretOne['Ok']);
        expect(uiSecretOne.username).toStrictEqual(secretOne.username); // Check decrypted values
        expect(uiSecretOne.password).toStrictEqual(secretOne.password); // Check decrypted values
        expect(uiSecretOne.notes).toStrictEqual(secretOne.notes); // Check decrypted values

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

        const addSecretArgsThree: AddSecretArgs = await createAddSecretArgs(actorOne, secretThree);
        const resultAddSecretThree: Result_1 = await actorOne.add_secret(addSecretArgsThree);
        expect(resultAddSecretThree).toHaveProperty('Ok');
        expect(resultAddSecretThree['Ok'].id).not.toBe(secretThree.id);
        expect(resultAddSecretThree['Ok'].name).toStrictEqual([secretThree.name]);
        expect(resultAddSecretThree['Ok'].url).toStrictEqual([secretThree.url]);
        expect(resultAddSecretThree['Ok'].username).toStrictEqual(addSecretArgsThree.username);
        expect(resultAddSecretThree['Ok'].password).toStrictEqual(addSecretArgsThree.password);
        expect(resultAddSecretThree['Ok'].notes).toStrictEqual(addSecretArgsThree.notes);
        expect(resultAddSecretThree['Ok'].category).toStrictEqual(addSecretArgsThree.category);
        expect(resultAddSecretThree['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretThree['Ok'].date_created).toStrictEqual(resultAddSecretThree['Ok'].date_modified);

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

    }, 30000); // Set timeout to 30s

    test("it should create the same secret twice", async () => {

        // Adding a new secret with the same attributes must work
        const addSecretArgsOne: AddSecretArgs = await createAddSecretArgs(actorOne, secretOne);
        const resultAddSecretOne = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');

    }, 15000); // Set timeout to 15s

    /*test("it should read secrets properly", async () => {
        // Check created secret via getSecretList
        const resultSecretList = await actorOne.get_secret_list();
        expect(resultSecretList).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretList['Ok'])).toBe(true);
        expect(resultSecretList['Ok']).toHaveLength(3);
        resultSecretList['Ok'].sort((a, b) => a.id.localeCompare(b.id)); // Sort by id
        expect(resultSecretList['Ok'][0].id).toStrictEqual(idOne);
        expect(resultSecretList['Ok'][0].name).toHaveLength(1);
        expect(resultSecretList['Ok'][0].name[0]).toStrictEqual(nameOne);
        expect(resultSecretList['Ok'][0].category).toHaveLength(1);
        expect(resultSecretList['Ok'][0].category[0]).toStrictEqual(categoryOne);
        expect(resultSecretList['Ok'][1].id).toStrictEqual(idTwo);
        expect(resultSecretList['Ok'][1].name).toHaveLength(1);
        expect(resultSecretList['Ok'][1].name[0]).toStrictEqual(nameTwo);
        expect(resultSecretList['Ok'][1].category).toHaveLength(1);
        expect(resultSecretList['Ok'][1].category[0]).toStrictEqual(categoryTwo);
        expect(resultSecretList['Ok'][2].id).toStrictEqual(idThree);
        expect(resultSecretList['Ok'][2].name).toHaveLength(1);
        expect(resultSecretList['Ok'][2].name[0]).toStrictEqual(nameThree);
        expect(resultSecretList['Ok'][2].category).toHaveLength(1);
        expect(resultSecretList['Ok'][2].category[0]).toStrictEqual(categoryThree);

        // Check created secret (encrypted values) via getSecret
        const resultSecretOne: Result_1 = await actorOne.get_secret(idOne);
        expect(resultSecretOne).toHaveProperty('Ok');
        expect(resultSecretOne['Ok'].id).toStrictEqual(idOne);
        expect(resultSecretOne['Ok'].name).toHaveLength(1);
        expect(resultSecretOne['Ok'].name[0]).toStrictEqual(nameOne);
        expect(resultSecretOne['Ok'].url).toHaveLength(1);
        expect(resultSecretOne['Ok'].url[0]).toStrictEqual(urlOne);
        expect(resultSecretOne['Ok'].category).toHaveLength(1);
        expect(resultSecretOne['Ok'].category[0]).toStrictEqual(categoryOne);
        expect(resultSecretOne['Ok'].username).toHaveLength(1);
        expect(resultSecretOne['Ok'].username[0]).toStrictEqual(usernameOneEncrypted);
        expect(resultSecretOne['Ok'].password).toHaveLength(1);
        expect(resultSecretOne['Ok'].password[0]).toStrictEqual(passwordOneEncrypted);
        expect(resultSecretOne['Ok'].notes).toHaveLength(1);
        expect(resultSecretOne['Ok'].notes[0]).toStrictEqual(notesOneEncrypted);
        expect((resultSecretOne['Ok'].date_modified)).toBeGreaterThan(0);
        expect((resultSecretOne['Ok'].date_created)).toStrictEqual(resultSecretOne['Ok'].date_modified);

        // Check decrypted values
        const vetKey = await getVetKey(actorOne);
        const resultSymmetricCryptoMaterial: Result_7 = await actorOne.get_secret_symmetric_crypto_material(idOne);
        expect(resultSecretOne).toHaveProperty('Ok');

        const decryptedSymmetricKey = await aes_gcm_decrypt(resultSymmetricCryptoMaterial['Ok'].encrypted_symmetric_key as Uint8Array, vetKey, resultSymmetricCryptoMaterial['Ok'].iv as Uint8Array);
        const username = await aes_gcm_decrypt(resultSecretOne['Ok'].username[0] as Uint8Array, decryptedSymmetricKey, resultSymmetricCryptoMaterial['Ok'].username_decryption_nonce[0] as Uint8Array);
        const password = await aes_gcm_decrypt(resultSecretOne['Ok'].password[0] as Uint8Array, decryptedSymmetricKey, resultSymmetricCryptoMaterial['Ok'].password_decryption_nonce[0] as Uint8Array);
        const notes = await aes_gcm_decrypt(resultSecretOne['Ok'].notes[0] as Uint8Array, decryptedSymmetricKey, resultSymmetricCryptoMaterial['Ok'].notes_decryption_nonce[0] as Uint8Array);
        expect(new TextDecoder().decode(username)).toStrictEqual(usernameOne);
        expect(new TextDecoder().decode(password)).toStrictEqual(passwordOne);
        expect(new TextDecoder().decode(notes)).toStrictEqual(notesOne);

        // Delete secrets again for following tests
        const resultRemoveSecretOne: Result_3 = await actorOne.remove_secret(idOne);
        expect(resultRemoveSecretOne).toHaveProperty('Ok');

    }, 30000); // Set timeout to 30s

    test("it should update secrets properly", async () => {
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