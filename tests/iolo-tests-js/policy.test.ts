import {beforeAll, describe, expect, test} from 'vitest';
import {
    createIoloUsersInBackend,
    createIdentity,
    createNewActor, createSecretInBackend,
    determineBackendCanisterId,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    Result_3, CreatePolicyArgs, Policy, _SERVICE, Result_2,
    UpdatePolicyArgs,
    UpdateXOutOfYCondition,
    Validator,
    Secret,
    UpdateLastLoginTimeCondition, UpdateFixedDateTimeCondition
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

const addPolicyArgsOne: CreatePolicyArgs = {
    name: [],
}

const addPolicyArgsTwo: CreatePolicyArgs = {
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

describe("POLICY - create_policy()", () => {
    test("it must create policies properly", async () => {
        // Minimal policy without name
        const resultAddPolicyOne: Result_2 = await actorOne.create_policy(addPolicyArgsOne);
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
        const resultAddPolicyTwo: Result_2 = await actorOne.create_policy(addPolicyArgsTwo);
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
});

describe("POLICY - update_policy()", () => {
    test("it must update policies properly", async () => {

        // Update policy with two secrets, two beneficiaries and all condition-types with AND operator
        const secretA: Secret = await createSecretInBackend('A', actorOne);
        const secretB: Secret = await createSecretInBackend('B', actorOne);

        const lastLoginTimeCondition: UpdateLastLoginTimeCondition = {
            id: "",
            number_of_days_since_last_login: BigInt(10),
        };
        const ValidatorOne: Validator = {
            principal_id: identityOne.getPrincipal().toString(),
            status: false,
        }
        const xOutOfYCondition: UpdateXOutOfYCondition = {
            id: "",
            quorum: BigInt(3),
            validators: [ValidatorOne],
            question: "Is the sky blue?",
        }
        const fixedDateTimeCondition: UpdateFixedDateTimeCondition = {
            id: "",
            time: 123456789n,
        }
        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: ['policyA'],
            beneficiaries: [identityTwo.getPrincipal().toString(), identityThree.getPrincipal().toString()],
            conditions: [{'LastLogin': lastLoginTimeCondition}, {'XOutOfY': xOutOfYCondition}, {'FixedDateTime': fixedDateTimeCondition}],
            conditions_logical_operator: [{'And': null}],
            secrets: [secretA.id, secretB.id],
            key_box: [[secretA.id, new Uint8Array([1, 2, 3])], [secretB.id, new Uint8Array([4, 5, 6])]],
        }

        let resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
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
        expect(resultUpdatePolicyOne['Ok'].conditions).toHaveLength(3);
        expect(resultUpdatePolicyOne['Ok'].conditions).toContainEqual({
            LastLogin: expect.objectContaining({
                id: expect.any(String),
                number_of_days_since_last_login: lastLoginTimeCondition.number_of_days_since_last_login,
                condition_status: false,
            })
        });
        expect(resultUpdatePolicyOne['Ok'].conditions).toContainEqual({
            XOutOfY: expect.objectContaining({
                id: expect.any(String),
                question: xOutOfYCondition.question,
                quorum: xOutOfYCondition.quorum,
                validators: xOutOfYCondition.validators,
                condition_status: false,
            })
        });
        expect(resultUpdatePolicyOne['Ok'].conditions).toContainEqual({
            FixedDateTime: expect.objectContaining({
                id: expect.any(String),
                time: fixedDateTimeCondition.time,
                condition_status: false
            })
        });
        expect(resultUpdatePolicyOne['Ok'].conditions_logical_operator).toStrictEqual(updatePolicyArgsOne.conditions_logical_operator);
        expect(resultUpdatePolicyOne['Ok'].conditions_status).toStrictEqual(false);
        expect(resultUpdatePolicyOne['Ok'].date_created).toStrictEqual(policyOne.date_created);
        expect(resultUpdatePolicyOne['Ok'].date_modified).toBeGreaterThan(policyOne.date_modified);
        policyOne.date_modified = resultUpdatePolicyOne['Ok'].date_modified;

    }, 60000); // Set timeout

    test("it must update conditions properly", async () => {
        // TODO
    });

    test("it must not update policy with a different owner", async () => {
        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: ['policyOneUpdated'],
            beneficiaries: [],
            conditions: [],
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };
        const resultUpdatePolicyOne: Result_2 = await actorTwo.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('PolicyDoesNotExist');
        expect(resultUpdatePolicyOne['Err'].PolicyDoesNotExist).toStrictEqual(updatePolicyArgsOne.id);

    }, 60000); // Set timeout

    test("it must not update a non-existing policy", async () => {
        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: 'non-existing-policy-id',
            name: [],
            beneficiaries: [],
            conditions: [],
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };
        const resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('PolicyDoesNotExist');
        expect(resultUpdatePolicyOne['Err'].PolicyDoesNotExist).toStrictEqual(updatePolicyArgsOne.id);

    }, 60000); // Set timeout

    test("it must not update with a non-existing secret", async () => {
        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: [],
            beneficiaries: [],
            conditions: [],
            conditions_logical_operator: [],
            secrets: ['non-existing-secret-id'],
            key_box: [],
        };
        const resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('SecretDoesNotExist');
        expect(resultUpdatePolicyOne['Err'].SecretDoesNotExist).toStrictEqual(updatePolicyArgsOne.secrets[0]);

    }, 60000); // Set timeout

    test("it must not update with a secret of a different user", async () => {
        const secretA: Secret = await createSecretInBackend('A', actorOne);
        const secretB: Secret = await createSecretInBackend('B', actorTwo);
        const secretC: Secret = await createSecretInBackend('C', actorOne);

        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: [],
            beneficiaries: [],
            conditions: [],
            conditions_logical_operator: [],
            secrets: [secretA.id, secretB.id, secretC.id],
            key_box: [[secretA.id, new Uint8Array([1, 2, 3])], [secretB.id, new Uint8Array([1, 2, 3])], [secretC.id, new Uint8Array([1, 2, 3])]],
        };

        const resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('SecretDoesNotExist');
        expect(resultUpdatePolicyOne['Err'].SecretDoesNotExist).toStrictEqual(secretB.id);

    }, 60000); // Set timeout

    test("it must not update with a secret that is not related in the key-box and vice-versa", async () => {
        const secretA: Secret = await createSecretInBackend('A', actorOne);
        const secretB: Secret = await createSecretInBackend('B', actorOne);

        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: [],
            beneficiaries: [],
            conditions: [],
            conditions_logical_operator: [],
            secrets: [secretA.id, secretB.id],
            key_box: [[secretA.id, new Uint8Array([1, 2, 3])]],
        };

        let resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('KeyBoxEntryDoesNotExistForSecret');
        expect(resultUpdatePolicyOne['Err'].KeyBoxEntryDoesNotExistForSecret).toStrictEqual(secretB.id);

        updatePolicyArgsOne = {
            id: policyOne.id,
            name: [],
            beneficiaries: [],
            conditions: [],
            conditions_logical_operator: [],
            secrets: [secretA.id],
            key_box: [[secretA.id, new Uint8Array([1, 2, 3])], [secretB.id, new Uint8Array([1, 2, 3])]],
        };

        resultUpdatePolicyOne = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('SecretEntryDoesNotExistForKeyBoxEntry');
        expect(resultUpdatePolicyOne['Err'].SecretEntryDoesNotExistForKeyBoxEntry).toStrictEqual(secretB.id);

    }, 60000); // Set timeout

    test("it must not update with a non-existing beneficiary", async () => {
        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: [],
            beneficiaries: ['non-existing-beneficiary-id'],
            conditions: [],
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };

        const resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('UserDoesNotExist');
        expect(resultUpdatePolicyOne['Err'].UserDoesNotExist).toStrictEqual(updatePolicyArgsOne.beneficiaries[0]);

    }, 60000); // Set timeout

    test("it must not update a non-existing condition", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update with a x-out-of-y condition validator that does not exist", async () => {
        // TODO

    }, 60000); // Set timeout

    test("it must not update with a x-out-of-y condition logical operator if only one policy is set", async () => {
        // TODO

    }, 60000); // Set timeout
});