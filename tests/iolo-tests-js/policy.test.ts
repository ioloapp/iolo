import {beforeAll, describe, expect, test} from 'vitest';
import {
    createAliceAndBob,
    createIdentity,
    createNewActor, createSecret,
    determineBackendCanisterId,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    Result_1, AddPolicyArgs, Policy, _SERVICE
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {ActorSubclass} from "@dfinity/agent";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const actorOne: ActorSubclass<_SERVICE> = createNewActor(identityOne, canisterId);
const actorTwo: ActorSubclass<_SERVICE> = createNewActor(identityTwo, canisterId);

const encrypted_symmetric_key = new TextEncoder().encode('mySuperKey'); // just a byte array, no symmetric key

const addPolicyArgsOne: AddPolicyArgs = {
    name: [],
}

const addPolicyArgsTwo: AddPolicyArgs = {
    name: ['policyB'],
}

let policyOne: Policy;
let policyTwo: Policy;

/*
 This test suit tests all policy related methods of the backend canister.
 Focus is on the correct return types and the correct behavior of the methods.
*/


beforeAll(async () => {
    await createAliceAndBob(actorOne, actorTwo);
});

describe("Policy Tests", () => {
    test("it must create policies properly", async () => {
        // Minimal policy without name
        const resultAddPolicyOne: Result_1 = await actorOne.add_policy(addPolicyArgsOne);
        expect(resultAddPolicyOne).toHaveProperty('Ok');
        expect(Object.keys(resultAddPolicyOne['Ok']).length).toStrictEqual(11);
        expect(Number(resultAddPolicyOne['Ok'].id)).not.toStrictEqual("");
        expect(resultAddPolicyOne['Ok'].name).toStrictEqual(addPolicyArgsOne.name);
        expect(resultAddPolicyOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal());
        expect(resultAddPolicyOne['Ok'].secrets).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].key_box).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].beneficiaries).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].conditions).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].conditions_logical_operator).toStrictEqual([]);
        expect(resultAddPolicyOne['Ok'].conditions_status).toStrictEqual(false);
        expect(resultAddPolicyOne['Ok'].date_created).toBeGreaterThan(0);
        expect(resultAddPolicyOne['Ok'].date_modified).toStrictEqual(resultAddPolicyOne['Ok'].date_created);
        policyOne = resultAddPolicyOne['Ok'];

        // Policy with name
        const resultAddPolicyTwo: Result_1 = await actorOne.add_policy(addPolicyArgsTwo);
        expect(resultAddPolicyTwo).toHaveProperty('Ok');
        expect(Object.keys(resultAddPolicyTwo['Ok']).length).toStrictEqual(11);
        expect(Number(resultAddPolicyTwo['Ok'].id)).not.toStrictEqual("");
        expect(resultAddPolicyTwo['Ok'].name).toStrictEqual(addPolicyArgsTwo.name);
        expect(resultAddPolicyTwo['Ok'].owner).toStrictEqual(identityOne.getPrincipal());
        expect(resultAddPolicyTwo['Ok'].secrets).toStrictEqual([]);
        expect(resultAddPolicyTwo['Ok'].key_box).toStrictEqual([]);
        expect(resultAddPolicyTwo['Ok'].beneficiaries).toStrictEqual([]);
        expect(resultAddPolicyTwo['Ok'].conditions).toStrictEqual([]);
        expect(resultAddPolicyTwo['Ok'].conditions_logical_operator).toStrictEqual([]);
        expect(resultAddPolicyTwo['Ok'].conditions_status).toStrictEqual(false);
        expect(resultAddPolicyTwo['Ok'].date_created).toBeGreaterThan(0);
        expect(resultAddPolicyTwo['Ok'].date_modified).toStrictEqual(resultAddPolicyTwo['Ok'].date_created);
        policyTwo = resultAddPolicyTwo['Ok'];

    }, 60000); // Set timeout

    test("it must update policies properly", async () => {
        policyOne.name = ['policyA'];
        const secretA = await createSecret('A', actorOne);
        policyOne.secrets = [secretA.id];

        const resultUpdatePolicyOne: Result_1 = await actorOne.update_policy(policyOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Ok');
        expect(Object.keys(resultUpdatePolicyOne['Ok']).length).toStrictEqual(11);
        expect(Number(resultUpdatePolicyOne['Ok'].id)).not.toStrictEqual("");
        expect(resultUpdatePolicyOne['Ok'].name).toStrictEqual(policyOne.name);
        expect(resultUpdatePolicyOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal());
        expect(resultUpdatePolicyOne['Ok'].secrets).toStrictEqual([secretA.id]);
        expect(resultUpdatePolicyOne['Ok'].key_box).toStrictEqual([]);
        expect(resultUpdatePolicyOne['Ok'].beneficiaries).toStrictEqual([]);
        expect(resultUpdatePolicyOne['Ok'].conditions).toStrictEqual([]);
        expect(resultUpdatePolicyOne['Ok'].conditions_logical_operator).toStrictEqual([]);
        expect(resultUpdatePolicyOne['Ok'].conditions_status).toStrictEqual(false);
        expect(resultUpdatePolicyOne['Ok'].date_created).toBeGreaterThan(0);
        expect(resultUpdatePolicyOne['Ok'].date_modified).toBeGreaterThan(resultUpdatePolicyOne['Ok'].date_created);

    }, 60000); // Set timeout

    test("it must not update a non-existing policy", async () => {
        policyOne.id = 'non-existing-id';
        const resultUpdatePolicyOne: Result_1 = await actorOne.update_policy(policyOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('PolicyDoesNotExist');

    }, 60000); // Set timeout

    test("it must not update the owner of a policy", async () => {
        policyTwo.owner = identityTwo.getPrincipal();
        const resultUpdatePolicyTwo: Result_1 = await actorOne.update_policy(policyTwo);
        expect(resultUpdatePolicyTwo).toHaveProperty('Err');
        expect(resultUpdatePolicyTwo['Err']).toHaveProperty('OnlyOwnerCanUpdatePolicy');

    }, 60000); // Set timeout

    test("it must not update the policy with a non-existing secret", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update the policy with a secret of a different user", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update the policy with a secret that is not in the key-box", async () => {
        // TODO

    }, 60000); // Set timeout
});