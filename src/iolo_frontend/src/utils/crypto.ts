import * as vetkd from "ic-vetkd-utils";
import {ActorSubclass} from "@dfinity/agent";
import {_SERVICE,} from "../../../declarations/iolo_backend/iolo_backend.did";
import {Principal} from "@dfinity/principal";
import {mapError} from "./errorMapper";
import {IoloError} from "../error/Errors";

const hex_decode = (hexString: string) =>
    Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const hex_encode = (bytes) =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export async function get_local_random_aes_256_gcm_key() {
    // Generate a random 256-bit key for AES-GCM
    const key = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true, // whether the key is extractable
        ["encrypt", "decrypt"]
    );

    // Exporting the key as a raw array buffer
    const rawKey = await window.crypto.subtle.exportKey("raw", key);
    return new Uint8Array(rawKey);
}

export async function get_aes_256_gcm_key_for_uservault(principal: Principal, actor: ActorSubclass<_SERVICE>) {
    const seed = window.crypto.getRandomValues(new Uint8Array(32));
    const tsk = new vetkd.TransportSecretKey(seed);
    const ek_bytes_hex = await actor.encrypted_symmetric_key_for_uservault(tsk.public_key());
    const pk_bytes_hex = await actor.symmetric_key_verification_key();
    const result = tsk.decrypt_and_hash(
        hex_decode(ek_bytes_hex),
        hex_decode(pk_bytes_hex),
        principal.toUint8Array(),
        32,
        new TextEncoder().encode("aes-256-gcm")
    );
    return result;
}

export async function get_aes_256_gcm_key_for_policy(id: string, actor: ActorSubclass<_SERVICE>) {
    const seed = window.crypto.getRandomValues(new Uint8Array(32));
    const tsk = new vetkd.TransportSecretKey(seed);
    const ek_bytes_hex = await actor.encrypted_symmetric_key_for_policies({encryption_public_key: tsk.public_key(), policy_id: id});
    if (!ek_bytes_hex['Ok']) {
        throw mapError(ek_bytes_hex['Err']);
    }
    const pk_bytes_hex = await actor.symmetric_key_verification_key();

    const derivationId: Uint8Array = new TextEncoder().encode(id);

    try {
        const result = tsk.decrypt_and_hash(
            hex_decode(ek_bytes_hex['Ok']),
            hex_decode(pk_bytes_hex),
            derivationId,
            32,
            new TextEncoder().encode("aes-256-gcm")
        );
        return result;
    } catch (e) {
        throw new IoloError(e.message)
    }
}

export async function aes_gcm_decrypt(ciphertext: Uint8Array, rawKey: Uint8Array, ivLength: number): Promise<Uint8Array> {
    // Extract the IV from the ciphertext
    const iv = ciphertext.slice(0, ivLength);

    // Extract the encrypted content from the ciphertext
    const encryptedContent = ciphertext.slice(ivLength);
    const aes_key: CryptoKey = await window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
    const decryptedContent: ArrayBuffer = await window.crypto.subtle.decrypt(
        {name: "AES-GCM", iv: iv},
        aes_key,
        encryptedContent
    );
    return new Uint8Array(decryptedContent);
}

export async function aes_gcm_encrypt(plaintext: string | Uint8Array, rawKey: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
    const aes_key: CryptoKey = await window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);

    // If data is a string, convert it to Uint8Array
    const plaintextArray = typeof plaintext === 'string' ? new TextEncoder().encode(plaintext) : plaintext;

    const encryptedContent = await window.crypto.subtle.encrypt(
        {name: "AES-GCM", iv: iv},
        aes_key,
        plaintextArray
    );

    // Combine the IV with the ciphertext for easier decryption
    const combined: Uint8Array = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedContent), iv.byteLength);
    return combined;
}
