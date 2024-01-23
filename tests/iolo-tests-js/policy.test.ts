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
import {AddPolicyArgs} from "../../.dfx/local/canisters/iolo_backend/service.did";

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
    id: "willBeRemovedInTheFuture-1",
    name: ['policyA'],
    secrets: [],
    beneficiaries: [],
    key_box: [],
    conditions: [],
    condition_logical_operator: { 'And' : null },
}

beforeAll(async () => {
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
});

describe("Policy Tests", () => {
    test("it should create policies properly", async () => {
  /*      const resultAddPolicyOne: Result_1 = await actorOne.add_policy(addPolicyArgsOne);
        console.log(resultAddPolicyOne);
        expect(resultAddPolicyOne).toHaveProperty('Ok');
        expect(Object.keys(resultAddPolicyOne['Ok']).length).toStrictEqual(10);

*/
    }, 60000); // Set timeout


});