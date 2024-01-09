import { expect, test, describe, beforeAll} from 'vitest';
import {
    aes_gcm_decrypt,
    createIdentity,
    createNewActor,
    createSecret,
    determineBackendCanisterId,
    getVetKey,
    SecretType
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {AddSecretArgs, Result, Result_5} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {
    Result_1,
    Result_3,
    Result_6,
    Result_7,
    SecretCategory
} from "../../.dfx/local/canisters/iolo_backend/service.did";
import {v4 as uuidv4} from 'uuid';

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with user.test.ts which is running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const actorOne = createNewActor(identityOne, canisterId);

const idOne: string = '1' + uuidv4(); // Add prefix to sort secret list properly
const nameOne = 'secretOne';
const urlOne = 'https://urlOne';
const categoryOne: SecretCategory = { 'Password' : null };
const usernameOne = 'userOne';
let usernameOneEncrypted: Uint8Array;
const passwordOne = 'pwOne';
let passwordOneEncrypted: Uint8Array;
const notesOne = 'notesOne';
let notesOneEncrypted: Uint8Array;
const idTwo: string = '2' + uuidv4(); // Add prefix to sort secret list properly
const nameTwo = 'secretTwo';
const urlTwo = 'https://urlTwo';
const categoryTwo: SecretCategory = { 'Document' : null };
const notesTwo = 'notesTwo';
const idThree: string = '3' + uuidv4(); // Add prefix to sort secret list properly
const nameThree = 'secretTwo';
const urlThree = 'https://urlTwo';
const categoryThree: SecretCategory = { 'Note' : null };
const notesThree = 'notesTwo';

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
        const addSecretArgsOne: AddSecretArgs = await createSecret(actorOne, idOne, nameOne, urlOne, categoryOne, usernameOne, passwordOne, notesOne);
        usernameOneEncrypted = addSecretArgsOne.username[0] as Uint8Array; // Store encrypted values for later tests
        passwordOneEncrypted = addSecretArgsOne.password[0] as Uint8Array; // Store encrypted values for later tests
        notesOneEncrypted = addSecretArgsOne.notes[0] as Uint8Array; // Store encrypted values for later tests
        const resultAddSecretOne: Result_1 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        expect(resultAddSecretOne['Ok'].id).toStrictEqual(idOne);
        expect(resultAddSecretOne['Ok'].name).toHaveLength(1);
        expect(resultAddSecretOne['Ok'].name[0]).toStrictEqual(nameOne);
        expect(resultAddSecretOne['Ok'].url).toHaveLength(1);
        expect(resultAddSecretOne['Ok'].url[0]).toStrictEqual(urlOne);
        expect(resultAddSecretOne['Ok'].username).toHaveLength(1);
        expect(resultAddSecretOne['Ok'].username[0]).toStrictEqual(addSecretArgsOne.username[0]);
        expect(resultAddSecretOne['Ok'].password).toHaveLength(1);
        expect(resultAddSecretOne['Ok'].password[0]).toStrictEqual(addSecretArgsOne.password[0]);
        expect(resultAddSecretOne['Ok'].notes).toHaveLength(1);
        expect(resultAddSecretOne['Ok'].notes[0]).toStrictEqual(addSecretArgsOne.notes[0]);
        expect(resultAddSecretOne['Ok'].category).toHaveLength(1);
        expect(resultAddSecretOne['Ok'].category[0]).toStrictEqual(categoryOne);
        expect(resultAddSecretOne['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretOne['Ok'].date_created).toStrictEqual(resultAddSecretOne['Ok'].date_modified);

        const addSecretArgsTwo: AddSecretArgs = await createSecret(actorOne, idTwo, nameTwo, urlTwo, categoryTwo, null, null, notesTwo);
        const resultAddSecretTwo: Result_1 = await actorOne.add_secret(addSecretArgsTwo);
        expect(resultAddSecretTwo).toHaveProperty('Ok');
        expect(resultAddSecretTwo['Ok'].id).toStrictEqual(idTwo);
        expect(resultAddSecretTwo['Ok'].name).toHaveLength(1);
        expect(resultAddSecretTwo['Ok'].name[0]).toStrictEqual(nameTwo);
        expect(resultAddSecretTwo['Ok'].url).toHaveLength(1);
        expect(resultAddSecretTwo['Ok'].url[0]).toStrictEqual(urlTwo);
        expect(resultAddSecretTwo['Ok'].username).toHaveLength(0);
        expect(resultAddSecretTwo['Ok'].password).toHaveLength(0);
        expect(resultAddSecretTwo['Ok'].notes).toHaveLength(1);
        expect(resultAddSecretTwo['Ok'].notes[0]).toStrictEqual(addSecretArgsTwo.notes[0]);
        expect(resultAddSecretTwo['Ok'].category).toHaveLength(1);
        expect(resultAddSecretTwo['Ok'].category[0]).toStrictEqual(categoryTwo);
        expect(resultAddSecretTwo['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretTwo['Ok'].date_created).toStrictEqual(resultAddSecretTwo['Ok'].date_modified);

        const addSecretArgsThree: AddSecretArgs = await createSecret(actorOne, idThree, nameThree, urlThree, categoryThree, null, null, notesThree);
        const resultAddSecretThree: Result_1 = await actorOne.add_secret(addSecretArgsThree);
        expect(resultAddSecretThree).toHaveProperty('Ok');
        expect(resultAddSecretThree['Ok'].id).toStrictEqual(idThree);
        expect(resultAddSecretThree['Ok'].name).toHaveLength(1);
        expect(resultAddSecretThree['Ok'].name[0]).toStrictEqual(nameThree);
        expect(resultAddSecretThree['Ok'].url).toHaveLength(1);
        expect(resultAddSecretThree['Ok'].url[0]).toStrictEqual(urlThree);
        expect(resultAddSecretThree['Ok'].username).toHaveLength(0);
        expect(resultAddSecretThree['Ok'].password).toHaveLength(0);
        expect(resultAddSecretThree['Ok'].notes).toHaveLength(1);
        expect(resultAddSecretThree['Ok'].notes[0]).toStrictEqual(addSecretArgsThree.notes[0]);
        expect(resultAddSecretThree['Ok'].category).toHaveLength(1);
        expect(resultAddSecretThree['Ok'].category[0]).toStrictEqual(categoryThree);
        expect(resultAddSecretThree['Ok'].date_modified).toBeGreaterThan(0);
        expect(resultAddSecretThree['Ok'].date_created).toStrictEqual(resultAddSecretThree['Ok'].date_modified);

    }, 30000); // Set timeout to 30s

    test("it should not create the same secret twice", async () => {

        // Adding a new secret with the same id must fail
        const addSecretArgsOne: AddSecretArgs = await createSecret(actorOne, idOne, nameOne, urlOne, categoryOne, usernameOne, passwordOne, notesOne);
        const resultAddSecretOne = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Err');
        expect((resultAddSecretOne['Err'])).toHaveProperty("SecretAlreadyExists");

    }, 15000); // Set timeout to 15s

    test("it should read secrets properly", async () => {
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