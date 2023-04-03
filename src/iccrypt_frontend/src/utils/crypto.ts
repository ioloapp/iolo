var RSAKey = require('rsa-key');

// from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

export function ab2base64(buffer: ArrayBuffer ) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

export function base642ab(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export function importRsaPublicKey(pem: string): Promise<CryptoKey> {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(
        pemHeader.length,
        pem.length - pemFooter.length
    );
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
}

export function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
    
    // Convert pem (pkcs1?) to pkcs8
    var key = new RSAKey(pem);
    var pkcs8Key = key.exportKey(); // Default format is pkcs8

    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pkcs8Key.substring(
        pemHeader.length,
        pkcs8Key.length - pemFooter.length
    );
    
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
 
    // convert from a binary string to an ArrayBuffer
    const privateKeyArrayBuffer = str2ab(binaryDerString);
    
    return window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyArrayBuffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );
}

export function encrypt(publicKey: CryptoKey, plaintext: string): Promise<ArrayBuffer> {
    let enc = new TextEncoder();
    let messageBuffer = enc.encode(plaintext);
    return window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        messageBuffer
    );
}

export async function decrypt(privateKey: CryptoKey, ciphertext: ArrayBuffer): Promise<string> {
    let messageDecrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        ciphertext
    );
    let dec = new TextDecoder();
    return dec.decode(messageDecrypted);
}