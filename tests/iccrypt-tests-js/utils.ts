import {execSync} from 'child_process';
import {Secp256k1KeyIdentity} from '@dfinity/identity-secp256k1';
import {HttpAgent} from "@dfinity/agent";
import {createActor} from "../../src/declarations/iccrypt_backend";
import * as crypto from "crypto";
import {CipherGCM} from "crypto";
import {
    AddSecretArgs,
    Secret,
    SecretDecryptionMaterial
} from "../../src/declarations/iccrypt_backend/iccrypt_backend.did";
import {v4 as uuidv4} from 'uuid';

export function determineBackendCanisterId(): string {
    let canisterId: string = null;
    try {
        // Execute the Bash script synchronously
        canisterId = execSync('dfx canister id iccrypt_backend', { encoding: 'utf-8' });
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

export function encryptWithAes256Gcm(plaintext: string, key: Buffer, iv: Buffer): Uint8Array {

    const cipher: CipherGCM = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted: string = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return new TextEncoder().encode(encrypted);
}
export enum SecretType {
    Password,
    Note,
    Document
}

export function createSecret(secretType: SecretType, idPrefix?: string, appendix?: string): AddSecretArgs {

    // TODO: Get vetKey
    //const vetkey = await getVetKey(actorOne);

    // TODO: Encrypt local symmetric key

    // Create locally a symmetric key to encrypt the secret plaintext values
    const key: Buffer = crypto.randomBytes(32); // For AES-256

    // Create a secret
    const ivUsername: Buffer = crypto.randomBytes(16);  // AES block size is 16 bytes
    const ivPassword: Buffer = crypto.randomBytes(16);  // AES block size is 16 bytes
    const ivNotes: Buffer = crypto.randomBytes(16);  // AES block size is 16 bytes
    let id: string = idPrefix + uuidv4();

    let category;
    switch (secretType) {
        case SecretType.Password:
            category = [{ 'Password' : null }];
            break;
        case SecretType.Document:
            category = [{ 'Document' : null }];
            break;
        case SecretType.Note:
            category = [{ 'Note' : null }];
            break;
    }

    const decryptionMaterial: SecretDecryptionMaterial = {
        encrypted_decryption_key: key, // TODO: replace with encrypted key, currently sending the key as plaintext because vetkd library is not working in Jest
        iv: new Uint8Array(16), // TODO: replace with iv of vetkd
        notes_decryption_nonce: [new Uint8Array(ivNotes.buffer, ivNotes.byteOffset, ivNotes.length)],
        password_decryption_nonce: [new Uint8Array(ivPassword.buffer, ivPassword.byteOffset, ivPassword.length)],
        username_decryption_nonce: [new Uint8Array(ivUsername.buffer, ivUsername.byteOffset, ivUsername.length)],
    }
    return {
        id: id,
        name: ['mySuperSecret' + appendix],
        url: ["https://mySuperUrl" + appendix],
        username: [encryptWithAes256Gcm('mySuperUsername' + appendix, key, ivUsername)],
        password: [encryptWithAes256Gcm('mySuperPassword' + appendix, key, ivPassword)],
        notes: [encryptWithAes256Gcm(' mySuperNote' + appendix, key, ivNotes)],
        category: category,
        decryption_material: decryptionMaterial
    };
}