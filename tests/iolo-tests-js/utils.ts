import {execSync} from 'child_process';
import {Secp256k1KeyIdentity} from '@dfinity/identity-secp256k1';
import {Actor, ActorSubclass, HttpAgent} from "@dfinity/agent";
import {createActor} from "../../src/declarations/iolo_backend";
import * as crypto from "crypto";
import {
    _SERVICE,
    AddSecretArgs,
    Result_7,
    Secret,
    SecretCategory,
    SecretSymmetricCryptoMaterial
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import * as vetkd from './wasm/ic_vetkd_utils';
import {UiSecret, UiSecretCategory} from "../../src/iolo_frontend/src/services/IoloTypesForUi";


export function determineBackendCanisterId(): string {
    let canisterId: string = null;
    try {
        // Execute the Bash script synchronously
        canisterId = execSync('dfx canister id iolo_backend', { encoding: 'utf-8' });
        canisterId = canisterId.replace(/\s+/g, ""); // Remove line break
    } catch (error) {
        console.error(`Script Error: ${error.message}`);
        process.exit(1);
    }
    return canisterId;
}

export function createIdentity(seed?: string): Secp256k1KeyIdentity {
    if (seed) {
        return Secp256k1KeyIdentity.fromSeedPhrase(seed);
    } else {
        return Secp256k1KeyIdentity.generate();
    }
}

export function createNewActor(identity: Secp256k1KeyIdentity, canisterId: string) {
    // Create agent
    const agent: HttpAgent = new HttpAgent({identity: identity, host: "http://127.0.0.1:4943"});

    // Create actor
    let actor;
    actor = createActor(canisterId, {
        agent: agent,
    });
    return actor;
}

export async function createAddSecretArgs(actor: ActorSubclass<_SERVICE>, secret: UiSecret): Promise<AddSecretArgs> {

    // Create a local symmetric key
    const symmetricKey = await get_local_random_aes_256_gcm_key();
    const ivSymmetricKey = crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message

    // Get vetKey
    const uservaultVetKey = await getVetKey(actor);

    // Encrypt local symmetric key with vetKey
    const encryptedSymmetricKey = await aes_gcm_encrypt(symmetricKey, uservaultVetKey, ivSymmetricKey);

    // Create a secret
    const ivUsername: Buffer = crypto.randomBytes(16);  // AES block size is 16 bytes
    const ivPassword: Buffer = crypto.randomBytes(16);  // AES block size is 16 bytes
    const ivNotes: Buffer = crypto.randomBytes(16);  // AES block size is 16 bytes

    const symmetricCryptoMaterial: SecretSymmetricCryptoMaterial = {
        encrypted_symmetric_key: encryptedSymmetricKey,
        iv: ivSymmetricKey,
        notes_decryption_nonce: [new Uint8Array(ivNotes.buffer, ivNotes.byteOffset, ivNotes.length)],
        password_decryption_nonce: [new Uint8Array(ivPassword.buffer, ivPassword.byteOffset, ivPassword.length)],
        username_decryption_nonce: [new Uint8Array(ivUsername.buffer, ivUsername.byteOffset, ivUsername.length)],
    }
    return {
        id: secret.id,
        name: secret.name ? [secret.name] : [],
        url: secret.url ? [secret.url] : [],
        username: secret.username ? [await aes_gcm_encrypt(secret.username, symmetricKey, ivUsername)] : [],
        password: secret.username ? [await aes_gcm_encrypt(secret.password, symmetricKey, ivPassword)] : [],
        notes: secret.notes ? [await aes_gcm_encrypt(secret.notes, symmetricKey, ivNotes)] : [],
        category: secret.category ? [mapToSecretCategory(secret.category)] : [],
        symmetric_crypto_material: symmetricCryptoMaterial
    };
}

export async function decryptSecret(actor: ActorSubclass<_SERVICE>, secret: Secret): Promise<UiSecret> {

    // Get vetKey
    const uservaultVetKey: Uint8Array = await getVetKey(actor);

    // Read encryption material
    const resultSymmetricCryptoMaterial: Result_7 = await actor.get_secret_symmetric_crypto_material(secret.id);

    // Decrypt symmetric key
    const decryptedSymmetricKey = await aes_gcm_decrypt(resultSymmetricCryptoMaterial['Ok'].encrypted_symmetric_key as Uint8Array, uservaultVetKey, resultSymmetricCryptoMaterial['Ok'].iv as Uint8Array);

    // Decrypt attributes
    let decryptedUsername = undefined;
    if (secret.username.length > 0) {
        decryptedUsername = await aes_gcm_decrypt(secret.username[0] as Uint8Array, decryptedSymmetricKey, resultSymmetricCryptoMaterial['Ok'].username_decryption_nonce[0] as Uint8Array);
    }
    let decryptedPassword = undefined;
    if (secret.password.length > 0) {
        decryptedPassword = await aes_gcm_decrypt(secret.password[0] as Uint8Array, decryptedSymmetricKey, resultSymmetricCryptoMaterial['Ok'].password_decryption_nonce[0] as Uint8Array);
    }

    let decryptedNotes = undefined;
    if (secret.notes.length > 0) {
        decryptedNotes = await aes_gcm_decrypt(secret.notes[0] as Uint8Array, decryptedSymmetricKey, resultSymmetricCryptoMaterial['Ok'].notes_decryption_nonce[0] as Uint8Array);
    }

    return {
        id: secret.id,
        name: secret.name[0],
        url: secret.url[0],
        username: secret.username.length == 1 ? new TextDecoder().decode(decryptedUsername) : null,
        password: secret.password.length == 1 ? new TextDecoder().decode(decryptedPassword) : null,
        notes: secret.notes.length == 1 ? new TextDecoder().decode(decryptedNotes) : null,
        category: mapToUiSecretCategory(secret.category[0]),
    };

}

export function mapToUiSecretCategory(category: SecretCategory): UiSecretCategory {
    if (category.hasOwnProperty('Password')) {
        return UiSecretCategory.Password;
    } else if (category.hasOwnProperty('Note')) {
        return UiSecretCategory.Note;
    } else if (category.hasOwnProperty('Document')) {
        return UiSecretCategory.Document;
    }

}

export function mapToSecretCategory(category: UiSecretCategory): SecretCategory {
    switch (category) {
        case UiSecretCategory.Password:
            return {Password: null};
        case UiSecretCategory.Note:
            return {Note: null};
        case UiSecretCategory.Document:
            return {Document: null};
    }
}

export async function getVetKey(actor: ActorSubclass<_SERVICE>) {
    const seed = crypto.randomBytes(32);
    const tsk = new vetkd.TransportSecretKey(seed);
    const ek_bytes_hex = await actor.encrypted_symmetric_key_for_caller(tsk.public_key());
    const pk_bytes_hex = await actor.symmetric_key_verification_key();
    let app_backend_principal = await Actor.agentOf(actor).getPrincipal();
    return tsk.decrypt_and_hash(
        hex_decode(ek_bytes_hex),
        hex_decode(pk_bytes_hex),
        app_backend_principal.toUint8Array(),
        32,
        new TextEncoder().encode("aes-256-gcm")
    );
}

const hex_decode = (hexString) =>
    Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const hex_encode = (bytes) =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

async function get_local_random_aes_256_gcm_key() {
    // Generate a random 256-bit key for AES-GCM
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true, // whether the key is extractable
        ["encrypt", "decrypt"]
    );

    // Exporting the key as a raw array buffer
    const rawKey = await crypto.subtle.exportKey("raw", key);
    return new Uint8Array(rawKey);
}

async function aes_gcm_encrypt(plaintext: string | Uint8Array, rawKey: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
    const aes_key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);

    // If data is a string, convert it to Uint8Array
    const plaintextArray = typeof plaintext === 'string' ? new TextEncoder().encode(plaintext) : plaintext;

    const encryptedContent = await crypto.subtle.encrypt(
        {name: "AES-GCM", iv: iv},
        aes_key,
        plaintextArray
    );

    return new Uint8Array(encryptedContent);
    // Combine the IV with the ciphertext for easier decryption
    //const combined: Uint8Array = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
    //combined.set(iv, 0);
    //combined.set(new Uint8Array(encryptedContent), iv.byteLength);
    //return combined;
}

export async function aes_gcm_decrypt(ciphertext: Uint8Array, rawKey: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
    const encryptedContent: Uint8Array = ciphertext;
    const aes_key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
    const decryptedContent: ArrayBuffer = await crypto.subtle.decrypt(
        {name: "AES-GCM", iv: iv},
        aes_key,
        encryptedContent
    );
    return new Uint8Array(decryptedContent);
}