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
    Secret,
    SecretCategory, Result_2, Result_7, _SERVICE
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {v4 as uuidv4} from 'uuid';
import {UiSecret, UiSecretCategory} from "../../src/iolo_frontend/src/services/IoloTypesForUi";
import {
    aes_gcm_decrypt,
    aes_gcm_encrypt,
    get_aes_256_gcm_key_for_user,
    get_local_random_aes_256_gcm_key
} from "./crypto";
import * as crypto from "crypto";
import {ActorSubclass} from "@dfinity/agent";


/*
 NOTE: This testsuite is not a real interface test since encryption and decryption only occurs in frontend and only the
       ByteArray is sent via the interfaces.
       Nevertheless, it's a crucial functionality which must be tested, including vetKey retrieval from the backend.
       TODO: Import crypto.ts from the frontend once the real npm from dfinity is exposed
 */
const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const actorOne: ActorSubclass<_SERVICE> = createNewActor(identityOne, canisterId);
const actorTwo: ActorSubclass<_SERVICE> = createNewActor(identityTwo, canisterId);

const ivLength = 12;
const secretOne: UiSecret = {
    id: uuidv4(),
    name: 'secretA',
    url: 'https://urlOne',
    category: UiSecretCategory.Password,
    username: 'userOne',
    password: 'pwOne',
    notes: 'notesOne',
};

let vetKeyOne: Uint8Array;
let vetKeyTwo: Uint8Array;

/*
 This test suit tests encryption and decryption of secrets and policies which happens in the frontend.
 Once ic_vetkd_utils is exposed as npm package, it should use the crypto.ts from the frontend.
 */


beforeAll(async () => {
    vetKeyOne = await get_aes_256_gcm_key_for_user(identityOne.getPrincipal(), actorOne);
    vetKeyTwo = await get_aes_256_gcm_key_for_user(identityTwo.getPrincipal(), actorTwo);

    await createIoloUsersInBackend([actorOne, actorTwo]);
}, 30000);


describe("Encryption and Decryption Tests", () => {

    test("it should create encrypted secrets properly", async () => {

        // Add secrets
        const addSecretArgsOne: AddSecretArgs = await encryptNewSecret(secretOne, vetKeyOne);

        const resultAddSecretOne: Result_2 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        secretOne.id = resultAddSecretOne['Ok'].id;

    }, 60000); // Set timeout

    test("it should decrypt created secrets properly", async () => {

        // Get secret
        const resultSecretOne: Result_2 = await actorOne.get_secret(secretOne.id);
        expect(resultSecretOne).toHaveProperty('Ok');

        // Get crypto material for secret
        const resultEncryptedSymmetricKeyOne: Result_7 = await actorOne.get_encrypted_symmetric_key(secretOne.id);
        expect(resultEncryptedSymmetricKeyOne).toHaveProperty('Ok');

        const decryptedSecretOne: UiSecret = await decryptSecret(resultSecretOne['Ok'], resultEncryptedSymmetricKeyOne['Ok'], vetKeyOne);
        expect(decryptedSecretOne.username).toStrictEqual(secretOne.username);
        expect(decryptedSecretOne.password).toStrictEqual(secretOne.password);
        expect(decryptedSecretOne.notes).toStrictEqual(secretOne.notes);

    }, 60000); // Set timeout

    test("it must not be possible to decrypt secrets with a vetkey of a different user", async () => {

        // Get secret
        const resultSecretOne: Result_2= await actorOne.get_secret(secretOne.id);
        expect(resultSecretOne).toHaveProperty('Ok');

        // Get crypto material for secret
        const resultSymmetricCryptoMaterialOne: Result_7 = await actorOne.get_encrypted_symmetric_key(secretOne.id);
        expect(resultSymmetricCryptoMaterialOne).toHaveProperty('Ok');

        // Try with vetKeyTwo, must fail
        await expect(decryptSecret(resultSecretOne['Ok'], resultSymmetricCryptoMaterialOne['Ok'], vetKeyTwo)).rejects.toThrow('The operation failed for an operation-specific reason');

    }, 60000); // Set timeout

});


async function encryptNewSecret(uiSecret: UiSecret, vetKey: Uint8Array): Promise<AddSecretArgs> {

    // Encrypt the symmetric key
    const symmetricKey = await get_local_random_aes_256_gcm_key();
    const ivSymmetricKey = crypto.getRandomValues(new Uint8Array(ivLength));
    const encryptedSymmetricKey = await aes_gcm_encrypt(symmetricKey, vetKey, ivSymmetricKey);

    // Encrypt optional secret attributes
    let encryptedUsername = new Uint8Array(0);
    const ivUsername = crypto.getRandomValues(new Uint8Array(ivLength));
    if (uiSecret.username) {
        encryptedUsername = await aes_gcm_encrypt(uiSecret.username, symmetricKey, ivUsername);
    }

    let encryptedPassword = new Uint8Array(0);
    const ivPassword = crypto.getRandomValues(new Uint8Array(ivLength));
    if (uiSecret.password) {
        encryptedPassword = await aes_gcm_encrypt(uiSecret.password, symmetricKey, ivPassword);
    }

    let encryptedNotes = new Uint8Array(0);
    const ivNotes = crypto.getRandomValues(new Uint8Array(ivLength));
    if (uiSecret.notes) {
        encryptedNotes = await aes_gcm_encrypt(uiSecret.notes, symmetricKey, ivNotes);
    }

    return {
        url: uiSecret.url ? [uiSecret.url] : [],
        name: [uiSecret.name],
        category: [mapUiSecretCategoryToSecretCategory(uiSecret.category)],
        username: encryptedUsername.length > 0 ? [encryptedUsername] : [],
        password: encryptedPassword.length > 0 ? [encryptedPassword] : [],
        notes: encryptedNotes.length > 0 ? [encryptedNotes] : [],
        encrypted_symmetric_key: encryptedSymmetricKey
    }
}

async function decryptSecret(secret: Secret, encryptedSymmetricKey: Uint8Array, vetKey: Uint8Array): Promise<UiSecret> {
    // Decrypt symmetric key
    const decryptedSymmetricKey = await aes_gcm_decrypt(encryptedSymmetricKey, vetKey, ivLength);

    // Decrypt attributes
    let decryptedUsername = undefined;
    if (secret.username.length > 0) {
        decryptedUsername = await aes_gcm_decrypt(secret.username[0] as Uint8Array, decryptedSymmetricKey, ivLength);
    }
    let decryptedPassword = undefined;
    if (secret.password.length > 0) {
        decryptedPassword = await aes_gcm_decrypt(secret.password[0] as Uint8Array, decryptedSymmetricKey, ivLength);
    }

    let decryptedNotes = undefined;
    if (secret.notes.length > 0) {
        decryptedNotes = await aes_gcm_decrypt(secret.notes[0] as Uint8Array, decryptedSymmetricKey, ivLength);
    }

    let uiSecret: UiSecret = {
        name: secret.name.length > 0 ? secret.name[0] : undefined,
        url: secret.url.length > 0 ? secret.url[0]: undefined,
        username: new TextDecoder().decode(decryptedUsername),
        password: new TextDecoder().decode(decryptedPassword),
        notes: new TextDecoder().decode(decryptedNotes),
        dateCreated: nanosecondsInBigintToIsoString(secret.date_modified),
        dateModified: nanosecondsInBigintToIsoString(secret.date_created),
    };

    if (secret.category.length === 0) {
        uiSecret.category = undefined;
    } else if (secret.category[0].hasOwnProperty(UiSecretCategory.Password)) {
        uiSecret.category = UiSecretCategory.Password;
    } else if (secret.category[0].hasOwnProperty(UiSecretCategory.Document)) {
        uiSecret.category = UiSecretCategory.Document;
    } else if (secret.category[0].hasOwnProperty(UiSecretCategory.Note)) {
        uiSecret.category = UiSecretCategory.Note;
    } else {
        uiSecret.category = undefined;
    }

    return uiSecret;
}

function mapUiSecretCategoryToSecretCategory(uiCategory: UiSecretCategory): SecretCategory {
    switch (uiCategory) {
        case UiSecretCategory.Password:
            return {'Password': null}
        case UiSecretCategory.Note:
            return {'Note': null}
        case UiSecretCategory.Document:
            return {'Document': null}
    }
}

function nanosecondsInBigintToIsoString(nanoseconds: BigInt): string {
    const number = Number(nanoseconds);
    const milliseconds = Number(number / 1000000);
    return new Date(milliseconds).toISOString();
}