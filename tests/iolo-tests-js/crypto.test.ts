import {beforeAll, describe, expect, test} from 'vitest';
import {
    createIdentity,
    createNewActor,
    determineBackendCanisterId,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {AddSecretArgs, Result} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {
    Result_1,
    Secret,
    SecretSymmetricCryptoMaterial,
    SecretCategory, Result_7,
} from "../../.dfx/local/canisters/iolo_backend/service.did";
import {v4 as uuidv4} from 'uuid';
import {UiSecret, UiSecretCategory} from "../../src/iolo_frontend/src/services/IoloTypesForUi";
import {
    aes_gcm_decrypt,
    aes_gcm_encrypt,
    get_aes_256_gcm_key_for_uservault,
    get_local_random_aes_256_gcm_key
} from "./crypto";
import * as crypto from "crypto";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const actorOne = createNewActor(identityOne, canisterId);
const actorTwo = createNewActor(identityTwo, canisterId);

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
const secretTwo: UiSecret = {
    id: uuidv4(),
    name: 'secretB',
    url: 'https://urlTwo',
    category: UiSecretCategory.Note,
    notes: 'notesTwo',
};
const secretThree: UiSecret = {
    id: uuidv4(),
    name: 'secretC',
    category: UiSecretCategory.Document,
    notes: 'notesThree',
};
const secretFour: UiSecret = {
    id: uuidv4(),
};

let vetKeyOne: Uint8Array;
let vetKeyTwo: Uint8Array;
beforeAll(async () => {
    vetKeyOne = await get_aes_256_gcm_key_for_uservault(identityOne.getPrincipal(), actorOne);
    vetKeyTwo = await get_aes_256_gcm_key_for_uservault(identityTwo.getPrincipal(), actorTwo);
});


describe("Encryption and Decryption Tests", () => {

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

    test("it should create encrypted secrets properly", async () => {

        // Add secrets
        const addSecretArgsOne: AddSecretArgs = await encryptNewSecret(secretOne, vetKeyOne);
        const resultAddSecretOne: Result_1 = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        secretOne.id = resultAddSecretOne['Ok'].id;

    }, 60000); // Set timeout

    test("it should decrypt secrets properly", async () => {

        // Get secret
        const resultSecretOne: Result_1 = await actorOne.get_secret(secretOne.id);
        expect(resultSecretOne).toHaveProperty('Ok');

        // Get crypto material for secret
        const resultSymmetricCryptoMaterialOne: Result_7 = await actorOne.get_secret_symmetric_crypto_material(secretOne.id);
        expect(resultSymmetricCryptoMaterialOne).toHaveProperty('Ok');

        const decryptedSecretOne: UiSecret = await decryptSecret(resultSecretOne['Ok'], resultSymmetricCryptoMaterialOne['Ok'].encrypted_symmetric_key, vetKeyOne);

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

    let symmetricCryptoMaterial: SecretSymmetricCryptoMaterial = {
        encrypted_symmetric_key: encryptedSymmetricKey,
        iv: [],
        username_decryption_nonce: [],
        password_decryption_nonce: [],
        notes_decryption_nonce: [],
    };

    return {
        id: uuidv4(),
        url: uiSecret.url ? [uiSecret.url] : [],
        name: [uiSecret.name],
        category: [mapUiSecretCategoryToSecretCategory(uiSecret.category)],
        username: encryptedUsername.length > 0 ? [encryptedUsername] : [],
        password: encryptedPassword.length > 0 ? [encryptedPassword] : [],
        notes: encryptedNotes.length > 0 ? [encryptedNotes] : [],
        symmetric_crypto_material: symmetricCryptoMaterial
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
        id: secret.id,
        name: secret.name.length > 0 ? secret.name[0] : undefined,
        url: secret.url.length > 0 ? secret.url[0]: undefined,
        username: decryptedUsername,
        password: decryptedPassword,
        notes: decryptedNotes,
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