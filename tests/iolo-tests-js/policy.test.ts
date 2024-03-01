import {beforeAll, describe, expect, test} from 'vitest';
import {
    createIoloUsersInBackend,
    createIdentity,
    createNewActor, createSecretInBackend,
    determineBackendCanisterId,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    CreatePolicyArgs, Policy, _SERVICE, Result_2,
    UpdatePolicyArgs,
    UpdateXOutOfYCondition,
    Validator,
    Secret,
    UpdateLastLoginTimeCondition, UpdateFixedDateTimeCondition, FixedDateTimeCondition, XOutOfYCondition,
    Result_8, Result_3
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {ActorSubclass} from "@dfinity/agent";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const identityThree: Secp256k1KeyIdentity = createIdentity();
const identityFour: Secp256k1KeyIdentity = createIdentity(); // Only principal, no iolo user!
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
let secretA: Secret;
let secretB: Secret;
let secretC: Secret;
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

    }, 60000); // Set timeout
});

describe("POLICY - update_policy()", () => {
    test("it must update policies properly by creating new attributes", async () => {

        // Update policy with two secrets, two beneficiaries and all condition-types with AND operator
        secretA = await createSecretInBackend('A', actorOne);
        secretB = await createSecretInBackend('B', actorOne);

        const lastLoginTimeCondition: UpdateLastLoginTimeCondition = {
            id: [],
            number_of_days_since_last_login: BigInt(10),
        };
        const ValidatorOne: Validator = {
            principal_id: identityOne.getPrincipal().toString(),
            status: false,
        }
        const xOutOfYCondition: UpdateXOutOfYCondition = {
            id: [],
            quorum: BigInt(1),
            validators: [ValidatorOne],
            question: "Is the sky blue?",
        }
        const fixedDateTimeCondition: UpdateFixedDateTimeCondition = {
            id: [],
            datetime: BigInt((Date.now() + 14 * 24 * 60 * 60 * 1000) * 1000000), // now + 14 days in nanoseconds
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
                datetime: fixedDateTimeCondition.datetime,
                condition_status: false
            })
        });
        expect(resultUpdatePolicyOne['Ok'].conditions_logical_operator).toStrictEqual(updatePolicyArgsOne.conditions_logical_operator);
        expect(resultUpdatePolicyOne['Ok'].conditions_status).toStrictEqual(false);
        expect(resultUpdatePolicyOne['Ok'].date_created).toStrictEqual(policyOne.date_created);
        expect(resultUpdatePolicyOne['Ok'].date_modified).toBeGreaterThan(policyOne.date_modified);
        policyOne = resultUpdatePolicyOne['Ok'];

    }, 60000); // Set timeout

    test("it must update policies properly by updating existing attributes", async () => {
        // Remove secretB and add a new one
        secretC = await createSecretInBackend('C', actorOne);
        let secrets: string[] = [secretA.id, secretC.id];

        // Remove lastLoginTimeCondition condition and update the two others
        let conditions = [];
        const xOutOfYCondition: XOutOfYCondition = (policyOne.conditions.find(condition => 'XOutOfY' in condition) as { 'XOutOfY': XOutOfYCondition } | undefined)?.['XOutOfY'];
        const updateXOutOfYCondition: UpdateXOutOfYCondition = {
            id: [xOutOfYCondition.id],
            quorum: BigInt(1),
            question: "Is the sky green?",
            validators: [{principal_id: identityTwo.getPrincipal().toString(), status: false}],
        };
        conditions.push({'XOutOfY': updateXOutOfYCondition});
        const fixedDateTimeCondition: FixedDateTimeCondition = (policyOne.conditions.find(condition => 'FixedDateTime' in condition) as { 'FixedDateTime': FixedDateTimeCondition } | undefined)?.['FixedDateTime'];
        const updateFixedDateTimeCondition: UpdateFixedDateTimeCondition = {
            id: [fixedDateTimeCondition.id],
            datetime: BigInt((Date.now() + 21 * 24 * 60 * 60 * 1000) * 1000000), // now + 21 days in nanoseconds
        };
        conditions.push({'FixedDateTime': updateFixedDateTimeCondition});

        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: ['policyAUpdated'],
            beneficiaries: [identityTwo.getPrincipal().toString()], // Remove identityThree
            conditions: conditions,
            conditions_logical_operator: [{'Or': null}], // Change operator
            secrets: secrets,
            key_box: [[secretA.id, new Uint8Array([1, 2, 3])], [secretC.id, new Uint8Array([4, 5, 6])]],
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
        expect(resultUpdatePolicyOne['Ok'].beneficiaries).toHaveLength(1);
        expect(resultUpdatePolicyOne['Ok'].beneficiaries).toContainEqual(updatePolicyArgsOne.beneficiaries[0]);
        expect(resultUpdatePolicyOne['Ok'].conditions).toHaveLength(2);
        expect(resultUpdatePolicyOne['Ok'].conditions).toContainEqual({
            XOutOfY: expect.objectContaining({
                id: xOutOfYCondition.id, // id as string, not as array
                question: updateXOutOfYCondition.question,
                quorum: updateXOutOfYCondition.quorum,
                validators: updateXOutOfYCondition.validators,
                condition_status: xOutOfYCondition.condition_status,
            })
        });
        expect(resultUpdatePolicyOne['Ok'].conditions).toContainEqual({
            FixedDateTime: expect.objectContaining({
                id: fixedDateTimeCondition.id, // id as string, not as array
                datetime: updateFixedDateTimeCondition.datetime,
                condition_status: xOutOfYCondition.condition_status,
            })
        });
        expect(resultUpdatePolicyOne['Ok'].conditions_logical_operator).toStrictEqual(updatePolicyArgsOne.conditions_logical_operator);
        expect(resultUpdatePolicyOne['Ok'].conditions_status).toStrictEqual(false);
        expect(resultUpdatePolicyOne['Ok'].date_created).toStrictEqual(policyOne.date_created);
        expect(resultUpdatePolicyOne['Ok'].date_modified).toBeGreaterThan(policyOne.date_modified);
        policyOne = resultUpdatePolicyOne['Ok'];

    }, 60000); // Set timeout

   /* test("it must not update policy of a different principal", async () => {
        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: policyOne.name,
            beneficiaries: [],
            conditions: [],
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };
        const resultUpdatePolicyOne: Result_2 = await actorTwo.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('CallerNotPolicyOwner');
        expect(resultUpdatePolicyOne['Err'].CallerNotPolicyOwner).toStrictEqual(updatePolicyArgsOne.id);

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
            name: policyOne.name,
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
            name: policyOne.name,
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
            name: policyOne.name,
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
            name: policyOne.name,
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

        // x-out-of-y condition
        let conditions = [];
        const updateXOutOfYCondition: UpdateXOutOfYCondition = {
            id: ['non-existing-condition-id'],
            quorum: BigInt(1),
            question: "Is the sky green?",
            validators: [{principal_id: identityTwo.getPrincipal().toString(), status: false}],
        };
        conditions.push({'XOutOfY': updateXOutOfYCondition});

        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: policyOne.name,
            beneficiaries: [],
            conditions: conditions,
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };

        let resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('PolicyConditionDoesNotExist');

        // fixed-date-time condition
        conditions = [];
        const updateFixedDateTimeCondition: UpdateFixedDateTimeCondition = {
            id: ['non-existing-condition-id'],
            datetime: BigInt((Date.now() + 14 * 24 * 60 * 60 * 1000) * 1000000), // now + 14 days in nanoseconds
        };
        conditions.push({'FixedDateTime': updateFixedDateTimeCondition});

        updatePolicyArgsOne = {
            id: policyOne.id,
            name: policyOne.name,
            beneficiaries: [],
            conditions: conditions,
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };

        resultUpdatePolicyOne = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('PolicyConditionDoesNotExist');

        // last-login-time condition
        conditions = [];
        const updateLastLoginTimeCondition: UpdateLastLoginTimeCondition = {
            id: ['non-existing-condition-id'],
            number_of_days_since_last_login: BigInt(10),
        };
        conditions.push({'LastLogin': updateLastLoginTimeCondition});

        updatePolicyArgsOne = {
            id: policyOne.id,
            name: policyOne.name,
            beneficiaries: [],
            conditions: conditions,
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };
        resultUpdatePolicyOne = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('PolicyConditionDoesNotExist');

    }, 60000); // Set timeout

    test("it must not update with an x-out-of-y condition validator that does not exist", async () => {
        let conditions = [];
        const updateXOutOfYCondition: UpdateXOutOfYCondition = {
            id: [],
            quorum: BigInt(5),
            question: "Is the sky green?",
            validators: [{principal_id: identityTwo.getPrincipal().toString(), status: false}, {principal_id: identityFour.getPrincipal().toString(), status: false}],
        };
        conditions.push({'XOutOfY': updateXOutOfYCondition});

        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: policyOne.name,
            beneficiaries: [],
            conditions: conditions,
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        }

        let resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('UserDoesNotExist');
        expect(resultUpdatePolicyOne['Err'].UserDoesNotExist).toStrictEqual(identityFour.getPrincipal().toString());

    }, 60000); // Set timeout

    test("it must not update with a logical operator if only one condition is set", async () => {
        let conditions = [];
        const updateXOutOfYCondition: UpdateXOutOfYCondition = {
            id: [],
            quorum: BigInt(5),
            question: "Is the sky green?",
            validators: [{principal_id: identityTwo.getPrincipal().toString(), status: false}],
        };
        conditions.push({'XOutOfY': updateXOutOfYCondition});

        let updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: policyOne.name,
            beneficiaries: [],
            conditions: conditions,
            conditions_logical_operator: [{'And': null}],
            secrets: [],
            key_box: [],
        }

        let resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('LogicalOperatorWithLessThanTwoConditions');

    }, 60000); // Set timeout

    test("it must not update a time based condition with a datetime in the past", async () => {
        let conditions = [];
        const updateFixedDateTimeCondition: UpdateFixedDateTimeCondition = {
            id: [],
            datetime: BigInt((Date.now() - 60 * 1000) * 1000000), // now  1 minute in nanoseconds
        };
        conditions.push({'FixedDateTime': updateFixedDateTimeCondition});

        const updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: policyOne.name,
            beneficiaries: [],
            conditions: conditions,
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };

        const resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('InvalidDateTime');
        expect(resultUpdatePolicyOne['Err'].InvalidDateTime).toStrictEqual(updateFixedDateTimeCondition.datetime.toString());

    }, 60000); // Set timeout

    test("it must not update an x-out-of-y condition with a quorum that is not less than the number of validators", async () => {
        let conditions = [];
        const updateXOutOfYCondition: UpdateXOutOfYCondition = {
            id: [],
            quorum: BigInt(2),
            question: "Is the sky green?",
            validators: [{principal_id: identityTwo.getPrincipal().toString(), status: false}],
        };
        conditions.push({'XOutOfY': updateXOutOfYCondition});

        const updatePolicyArgsOne: UpdatePolicyArgs = {
            id: policyOne.id,
            name: policyOne.name,
            beneficiaries: [],
            conditions: conditions,
            conditions_logical_operator: [],
            secrets: [],
            key_box: [],
        };

        const resultUpdatePolicyOne: Result_2 = await actorOne.update_policy(updatePolicyArgsOne);
        expect(resultUpdatePolicyOne).toHaveProperty('Err');
        expect(resultUpdatePolicyOne['Err']).toHaveProperty('InvalidQuorum');

    }, 60000); // Set timeout
*/
});


describe("POLICY - get_policy_as_owner()", () => {
    test("it must read a policy properly", async () => {
        let resultGetPolicyOne: Result_8 = await actorOne.get_policy_as_owner(policyOne.id);
        expect(resultGetPolicyOne).toHaveProperty('Ok');

        // Read secrets to compare with the result
        let secrets: Secret[] = [];
        for (const secretId of policyOne.secrets) {
            let resultGetSecret: Result_3 = await actorOne.get_secret(secretId);
            expect(resultGetSecret).toHaveProperty('Ok');
            secrets.push(resultGetSecret['Ok']);
        }

        expect(Object.keys(resultGetPolicyOne['Ok']).length).toStrictEqual(11);
        expect(resultGetPolicyOne['Ok'].id).toStrictEqual(policyOne.id);
        expect(resultGetPolicyOne['Ok'].name).toStrictEqual(policyOne.name);
        expect(resultGetPolicyOne['Ok'].owner).toStrictEqual(identityOne.getPrincipal().toString());
        expect(resultGetPolicyOne['Ok'].secrets).toHaveLength(2)
        expect(resultGetPolicyOne['Ok'].secrets).toContainEqual({
            id: secrets[0].id,
            name: secrets[0].name,
            category: secrets[0].category,
        });
        expect(resultGetPolicyOne['Ok'].secrets).toContainEqual({
            id: secrets[0].id,
            name: secrets[0].name,
            category: secrets[0].category,
        });
        expect(resultGetPolicyOne['Ok'].key_box).toHaveLength(2);
        expect(resultGetPolicyOne['Ok'].key_box).toContainEqual(policyOne.key_box[0]);
        expect(resultGetPolicyOne['Ok'].key_box).toContainEqual(policyOne.key_box[1]);
        expect(resultGetPolicyOne['Ok'].beneficiaries).toHaveLength(1);
        expect(resultGetPolicyOne['Ok'].beneficiaries).toContainEqual(policyOne.beneficiaries[0]);
        expect(resultGetPolicyOne['Ok'].conditions).toHaveLength(2);
        expect(resultGetPolicyOne['Ok'].conditions).toContainEqual(policyOne.conditions[0]);
        expect(resultGetPolicyOne['Ok'].conditions).toContainEqual(policyOne.conditions[1]);
        expect(resultGetPolicyOne['Ok'].conditions_logical_operator).toStrictEqual(policyOne.conditions_logical_operator);
        expect(resultGetPolicyOne['Ok'].conditions_status).toStrictEqual(policyOne.conditions_status);
        expect(resultGetPolicyOne['Ok'].date_created).toStrictEqual(policyOne.date_created);
        expect(resultGetPolicyOne['Ok'].date_modified).toStrictEqual(policyOne.date_modified);
    });
});