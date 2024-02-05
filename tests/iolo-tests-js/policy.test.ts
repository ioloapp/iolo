import {beforeAll, describe, expect, test} from 'vitest';
import {
    createIdentity,
    createNewActor,
    determineBackendCanisterId,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    Result,
    Result_2,
    Result_1, SecretSymmetricCryptoMaterial
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {AddPolicyArgs, AddOrUpdateUserArgs} from "../../.dfx/local/canisters/iolo_backend/service.did";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const actorOne = createNewActor(identityOne, canisterId);
const actorTwo = createNewActor(identityTwo, canisterId);

const symmetricCryptoMaterial: SecretSymmetricCryptoMaterial = {
    encrypted_symmetric_key: new TextEncoder().encode('mySuperKey'), // just a byte array, no symmetric key
};
const addPolicyArgsOne: AddPolicyArgs = {
    name: ['policyA'],
}

beforeAll(async () => {
    const addOrUpdateUserArgsOne: AddOrUpdateUserArgs = {
        name: ['Alice'],
        email: ['alice@ioloapp.io'],
        user_type: [{ 'Person' : null }],
    };
    const resultCreateUserOne: Result = await actorOne.create_user(addOrUpdateUserArgsOne);
    expect(resultCreateUserOne).toHaveProperty('Ok');

    const addOrUpdateUserArgsTwo: AddOrUpdateUserArgs = {
        name: ['Bob'],
        email: ['bob@ioloapp.io'],
        user_type: [{ 'Person' : null }],
    };
    const resultCreateUserTwo: Result = await actorTwo.create_user(addOrUpdateUserArgsTwo);
    expect(resultCreateUserTwo).toHaveProperty('Ok');
});

describe("Policy Tests", () => {
    test("it should create policies properly", async () => {
        // Minimal policy without secrets, beneficiaries, or conditions
        const resultAddPolicyOne: Result_1 = await actorOne.add_policy(addPolicyArgsOne);
        expect(resultAddPolicyOne).toHaveProperty('Ok');
        expect(Object.keys(resultAddPolicyOne['Ok']).length).toStrictEqual(11);
        expect(Number(resultAddPolicyOne['Ok'].id)).toBeGreaterThan(0);
        expect(resultAddPolicyOne['Ok'].name).toStrictEqual(addPolicyArgsOne.name);
        expect(resultAddPolicyOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal());
        expect(resultAddPolicyOne['Ok'].secrets).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].key_box).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].beneficiaries).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].conditions).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].conditions_logical_operator).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].conditions_status).toStrictEqual(false);
        expect(resultAddPolicyOne['Ok'].date_created).toBeGreaterThan(0);
        expect(resultAddPolicyOne['Ok'].date_modified).toStrictEqual(resultAddPolicyOne['Ok'].date_created); // Must be granter than date_created because the update request is the second request
    }, 60000); // Set timeout

});