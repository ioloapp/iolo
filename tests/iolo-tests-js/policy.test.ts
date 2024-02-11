import {beforeAll, describe, expect, test} from 'vitest';
import {
    createIoloUsersInBackend,
    createIdentity,
    createNewActor, createSecretInBackend,
    determineBackendCanisterId,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    Result_1, AddPolicyArgs, Policy, _SERVICE,Condition,
    TimeBasedCondition,
    UpdatePolicyArgs,
    XOutOfYCondition,
    Validator,
    Secret
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {ActorSubclass} from "@dfinity/agent";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const identityThree: Secp256k1KeyIdentity = createIdentity();
const actorOne: ActorSubclass<_SERVICE> = createNewActor(identityOne, canisterId);
const actorTwo: ActorSubclass<_SERVICE> = createNewActor(identityTwo, canisterId);
const actorThree: ActorSubclass<_SERVICE> = createNewActor(identityThree, canisterId);

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
    await createIoloUsersInBackend([actorOne, actorTwo, actorThree]);
});

describe("Policy Tests", () => {
    test("it must create policies properly", async () => {
        // Minimal policy without name
        const resultAddPolicyOne: Result_1 = await actorOne.add_policy(addPolicyArgsOne);
        expect(resultAddPolicyOne).toHaveProperty('Ok');
        expect(Object.keys(resultAddPolicyOne['Ok']).length).toStrictEqual(11);
        expect(Number(resultAddPolicyOne['Ok'].id)).not.toStrictEqual("");
        expect(resultAddPolicyOne['Ok'].name).toStrictEqual(addPolicyArgsOne.name);
        expect(resultAddPolicyOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString());
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
        expect(resultAddPolicyTwo['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString());
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

        // Update policy with one secret, one beneficiary and one condition only and no logical operator
        const secretA: Secret = await createSecretInBackend('A', actorOne);
        const timeBasedCondition: TimeBasedCondition = {
            id: "idOne",
            number_of_days_since_last_login: BigInt(10),
            condition_status: false,
        };
        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: ['policyA'],
            beneficiaries: [identityTwo.getPrincipal().toString()],
            conditions: [{'TimeBasedCondition': timeBasedCondition}],
            conditions_logical_operator: [],
            secrets: [secretA.id],
            key_box: [[secretA.id, new Uint8Array([1, 2, 3])]], // Just a random key
        }

        let resultUpdatePolicyOne: Result_1 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Ok');
        expect(Object.keys(resultUpdatePolicyOne['Ok']).length).toStrictEqual(11);
        expect(Number(resultUpdatePolicyOne['Ok'].id)).not.toStrictEqual("");
        expect(resultUpdatePolicyOne['Ok'].name).toStrictEqual(updatePolicyArgsOne.name);
        expect(resultUpdatePolicyOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString());
        expect(resultUpdatePolicyOne['Ok'].secrets).toHaveLength(1);
        expect(resultUpdatePolicyOne['Ok'].secrets).toContainEqual(updatePolicyArgsOne.secrets[0]);
        expect(resultUpdatePolicyOne['Ok'].key_box).toHaveLength(1);
        expect(resultUpdatePolicyOne['Ok'].key_box).toContainEqual(updatePolicyArgsOne.key_box[0]);
        expect(resultUpdatePolicyOne['Ok'].beneficiaries).toHaveLength(1);
        expect(resultUpdatePolicyOne['Ok'].beneficiaries).toContainEqual(updatePolicyArgsOne.beneficiaries[0]);
        expect(resultUpdatePolicyOne['Ok'].conditions).toHaveLength(1);
        expect(resultUpdatePolicyOne['Ok'].conditions).toContainEqual(updatePolicyArgsOne.conditions[0]);
        expect(resultUpdatePolicyOne['Ok'].conditions_logical_operator).toStrictEqual(updatePolicyArgsOne.conditions_logical_operator);
        expect(resultUpdatePolicyOne['Ok'].conditions_status).toStrictEqual(false);
        expect(resultUpdatePolicyOne['Ok'].date_created).toStrictEqual(policyOne.date_created);
        expect(resultUpdatePolicyOne['Ok'].date_modified).toBeGreaterThan(policyOne.date_modified);
        policyOne = resultUpdatePolicyOne['Ok'];

        // Add another condition with a logical operator, a second secret and a second beneficiary
        const ValidatorOne: Validator = {
            id: identityOne.getPrincipal().toString(),
            status: false,
        }
        const xOutOfYCondition: XOutOfYCondition = {
            id: "idTwo",
            quorum: BigInt(3),
            validators: [ValidatorOne],
            condition_status: false,
        }
        let conditions: Array<Condition> = policyOne.conditions;
        conditions.push({'XOutOfYCondition': xOutOfYCondition});
        let secrets = policyOne.secrets;
        const secretB: Secret = await createSecretInBackend('B', actorOne);
        secrets.push(secretB.id);
        let keyBox = policyOne.key_box;
        keyBox.push([secretB.id, new Uint8Array([4, 5, 6])]);
        let beneficiaries = policyOne.beneficiaries;
        beneficiaries.push(identityThree.getPrincipal().toString());
        updatePolicyArgsOne = {
            id: policyOne.id,
            name: ['policyAUpdated'],
            beneficiaries: beneficiaries,
            conditions: conditions,
            conditions_logical_operator: [{'And': null}],
            secrets: secrets,
            key_box: keyBox
        }

        resultUpdatePolicyOne = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Ok');
        expect(Object.keys(resultUpdatePolicyOne['Ok']).length).toStrictEqual(11);
        expect(Number(resultUpdatePolicyOne['Ok'].id)).not.toStrictEqual("");
        expect(resultUpdatePolicyOne['Ok'].name).toStrictEqual(updatePolicyArgsOne.name);
        expect(resultUpdatePolicyOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString());
        expect(resultUpdatePolicyOne['Ok'].secrets).toHaveLength(2)
        expect(resultUpdatePolicyOne['Ok'].secrets).toContainEqual(updatePolicyArgsOne.secrets[0]);
        expect(resultUpdatePolicyOne['Ok'].secrets).toContainEqual(updatePolicyArgsOne.secrets[1]);
        expect(resultUpdatePolicyOne['Ok'].key_box).toHaveLength(2);
        expect(resultUpdatePolicyOne['Ok'].key_box).toContainEqual(updatePolicyArgsOne.key_box[0]);
        expect(resultUpdatePolicyOne['Ok'].key_box).toContainEqual(updatePolicyArgsOne.key_box[1]);
        expect(resultUpdatePolicyOne['Ok'].beneficiaries).toHaveLength(2);
        expect(resultUpdatePolicyOne['Ok'].beneficiaries).toContainEqual(updatePolicyArgsOne.beneficiaries[0]);
        expect(resultUpdatePolicyOne['Ok'].beneficiaries).toContainEqual(updatePolicyArgsOne.beneficiaries[1]);
        expect(resultUpdatePolicyOne['Ok'].conditions).toHaveLength(2);
        expect(resultUpdatePolicyOne['Ok'].conditions).toContainEqual(updatePolicyArgsOne.conditions[0]);
        expect(resultUpdatePolicyOne['Ok'].conditions).toContainEqual(updatePolicyArgsOne.conditions[1]);
        expect(resultUpdatePolicyOne['Ok'].conditions_logical_operator).toStrictEqual(updatePolicyArgsOne.conditions_logical_operator);
        expect(resultUpdatePolicyOne['Ok'].conditions_status).toStrictEqual(false);
        expect(resultUpdatePolicyOne['Ok'].date_created).toStrictEqual(policyOne.date_created);
        expect(resultUpdatePolicyOne['Ok'].date_modified).toBeGreaterThan(policyOne.date_modified);

    }, 60000); // Set timeout

    test("it must not update a non-existing policy", async () => {
        policyOne.id = 'non-existing-id';
        const resultUpdatePolicyOne: Result_1 = await actorOne.update_policy(policyOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('PolicyDoesNotExist');

    }, 60000); // Set timeout

    test("it must not update with a non-existing secret", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update with a secret of a different user", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update with a secret that is related in the key-box", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update with a non-existing beneficiary", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update the general condition status", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update the condition status in each condition", async () => {
        // TODO

    }, 60000); // Set timeout
});