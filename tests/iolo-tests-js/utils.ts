import {execSync} from 'child_process';
import {Secp256k1KeyIdentity} from '@dfinity/identity-secp256k1';
import {Actor, ActorSubclass, HttpAgent} from "@dfinity/agent";
import {createActor} from "../../src/declarations/iolo_backend";
import * as crypto from "crypto";
import {
    _SERVICE,
    AddSecretArgs,
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {SecretSymmetricCryptoMaterial} from "../../src/declarations/iolo_backend/iolo_backend.did";
import  * as vetkd from './wasm/ic_vetkd_utils';
import {SecretCategory} from "../../.dfx/local/canisters/iolo_backend/service.did";


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

export enum SecretType {
    Password,
    Note,
    Document,
}

export async function createSecret(actor: ActorSubclass<_SERVICE>, id: string, name?: string, url?: string, category?: SecretCategory, username?: string, password?: string, notes?: string): Promise<AddSecretArgs> {

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
        id: id,
        name: name? [name] : [],
        url: url? [url] : [],
        username: username? [await aes_gcm_encrypt(username, symmetricKey, ivUsername)] : [],
        password: username? [await aes_gcm_encrypt(password, symmetricKey, ivPassword)] : [],
        notes: notes? [await aes_gcm_encrypt(notes, symmetricKey, ivNotes)] : [],
        category: category? [category] : [],
        symmetric_crypto_material: symmetricCryptoMaterial
    };
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