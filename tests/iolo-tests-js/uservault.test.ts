import {createIdentity, createNewActor, createSecret, determineBackendCanisterId, SecretType} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {AddSecretArgs, Result, Result_5, SmartVaultErr} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {Result_2, Result_3} from "../../.dfx/local/canisters/iolo_backend/service.did";
//import * as fs from "fs";
//import * as ic_vetkd_utils from './wasm/ic_vetkd_utils_bg';

//const importObject = {
//    './ic_vetkd_utils_bg.js': ic_vetkd_utils
//};

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with user.test.ts which is running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();

const actorOne = createNewActor(identityOne, canisterId);

//let vetkd;

//beforeAll(async () => {
//    const vetkd_wasm = fs.readFileSync('./tests/iolo-tests-js/wasm/ic_vetkd_utils_bg.wasm');
//    vetkd = await globalThis.WebAssembly.instantiate(new Uint8Array(vetkd_wasm), importObject)
//        .then(result => result.instance.exports);
//})

describe("Uservault Tests", () => {
    test("it should create a uservault", async () => {
        const resultDeleteUserOne: Result_3 = await actorOne.delete_user(); // Just in case the user is already existing on the replica
        const resultCreateUserOne: Result_2 = await actorOne.create_user();
        expect(resultCreateUserOne).toHaveProperty('Ok');

        // Create a uservault
        const hasVault: boolean = await actorOne.is_user_vault_existing();
        expect(hasVault).toBe(true)

    }, 10000); // Set timeout to 10s

    test("it should create secrets properly", async () => {
        // Check that no secret exists
        let resultSecretList: Result_5 = await actorOne.get_secret_list();
        expect(resultSecretList).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretList['Ok'])).toBe(true);
        expect(resultSecretList['Ok']).toHaveLength(0);

        // Add two secrets
        let addSecretArgsOne: AddSecretArgs = createSecret(SecretType.Password, "A", "One"); // ensure that id one is returned first in response of get_secret_list below
        const resultAddSecretOne: Result = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');
        expect((resultAddSecretOne['Ok'].id)).toStrictEqual(addSecretArgsOne.id);
        expect((resultAddSecretOne['Ok'].url)).toStrictEqual(addSecretArgsOne.url);
        expect((resultAddSecretOne['Ok'].username)).toStrictEqual(addSecretArgsOne.username);
        expect((resultAddSecretOne['Ok'].password)).toStrictEqual(addSecretArgsOne.password);
        expect((resultAddSecretOne['Ok'].name)).toStrictEqual(addSecretArgsOne.name);
        expect((resultAddSecretOne['Ok'].notes)).toStrictEqual(addSecretArgsOne.notes);
        expect((resultAddSecretOne['Ok'].category)).toStrictEqual(addSecretArgsOne.category);

        let addSecretArgsTwo: AddSecretArgs = createSecret(SecretType.Note, "B","Two"); // ensure that id one is returned second in response of get_secret_list below
        const resultAddSecretTwo: Result = await actorOne.add_secret(addSecretArgsTwo);
        expect(resultAddSecretTwo).toHaveProperty('Ok');
        expect((resultAddSecretTwo['Ok'].id)).toStrictEqual(addSecretArgsTwo.id);
        expect((resultAddSecretTwo['Ok'].url)).toStrictEqual(addSecretArgsTwo.url);
        expect((resultAddSecretTwo['Ok'].username)).toStrictEqual(addSecretArgsTwo.username);
        expect((resultAddSecretTwo['Ok'].password)).toStrictEqual(addSecretArgsTwo.password);
        expect((resultAddSecretTwo['Ok'].name)).toStrictEqual(addSecretArgsTwo.name);
        expect((resultAddSecretTwo['Ok'].notes)).toStrictEqual(addSecretArgsTwo.notes);
        expect((resultAddSecretTwo['Ok'].category)).toStrictEqual(addSecretArgsTwo.category);

        // Check created secrets via getSecretList
        resultSecretList = await actorOne.get_secret_list();
        expect(resultSecretList).toHaveProperty('Ok');
        expect(Array.isArray(resultSecretList['Ok'])).toBe(true);
        expect(resultSecretList['Ok']).toHaveLength(2);
        expect(resultSecretList['Ok'][0].id).toStrictEqual(addSecretArgsOne.id);
        expect(resultSecretList['Ok'][0].name).toStrictEqual(addSecretArgsOne.name);
        expect(resultSecretList['Ok'][0].category).toStrictEqual(addSecretArgsOne.category);
        expect(resultSecretList['Ok'][1].id).toStrictEqual(addSecretArgsTwo.id);
        expect(resultSecretList['Ok'][1].name).toStrictEqual(addSecretArgsTwo.name);
        expect(resultSecretList['Ok'][1].category).toStrictEqual(addSecretArgsTwo.category);

        // Delete secrets again for following tests
        const resultRemoveSecretOne: Result_3 = await actorOne.remove_user_secret(addSecretArgsOne.id);
        expect(resultRemoveSecretOne).toHaveProperty('Ok');
        const resultRemoveSecretTwo: Result_3 = await actorOne.remove_user_secret(addSecretArgsTwo.id);
        expect(resultRemoveSecretTwo).toHaveProperty('Ok');

    }, 15000); // Set timeout to 15s

    test("it should not create the same secret twice", async () => {
        // Add a secret
        let addSecretArgsOne: AddSecretArgs = createSecret(SecretType.Password, "A", "One"); // ensure that id one is returned first in response of get_secret_list below
        let resultAddSecretOne: Result = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');

        // Adding the same secret again must fail
        resultAddSecretOne = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Err');
        expect((resultAddSecretOne['Err'])).toHaveProperty("SecretAlreadyExists");

    }, 15000); // Set timeout to 15s

    test("it should read secrets properly", async () => {
        // TODO
    }, 15000); // Set timeout to 15s

    test("it should update secrets properly", async () => {
        // Add a secret
        let addSecretArgsOne: AddSecretArgs = createSecret(SecretType.Password, "A", "One"); // ensure that id one is returned first in response of get_secret_list below
        let resultAddSecretOne: Result = await actorOne.add_secret(addSecretArgsOne);
        expect(resultAddSecretOne).toHaveProperty('Ok');

        // Update secret
        addSecretArgsOne.name = ['myUpdatedSuperSecretOne'];
        addSecretArgsOne.url = ['https://myUpdatedSuperUrlOne'];
    }, 15000); // Set timeout to 15s

    test("it should delete secrets properly", async () => {
        // TODO
    }, 15000); // Set timeout to 15s
});

/*async function getVetKey(actor) {
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
}*/

const hex_decode = (hexString) =>
    Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
const hex_encode = (bytes) =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
