import {beforeAll, describe, expect, test} from 'vitest';
import {
    createIoloUsersInBackend,
    createIdentity,
    createNewActor,
    determineBackendCanisterId, createSecretInBackend,
} from "./utils";
import {Secp256k1KeyIdentity} from "@dfinity/identity-secp256k1";
import {
    Result_2,
    Result_8,
    Result_10,
    Policy,
    _SERVICE, CreatePolicyArgs, UpdateFixedDateTimeCondition, UpdatePolicyArgs
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {ActorSubclass} from "@dfinity/agent";

const canisterId: string = determineBackendCanisterId();

// Use random identities to not interfere with other tests which are running in parallel
const identityOne: Secp256k1KeyIdentity = createIdentity();
const identityTwo: Secp256k1KeyIdentity = createIdentity();
const identityThree: Secp256k1KeyIdentity = createIdentity();
const identityFour: Secp256k1KeyIdentity = createIdentity();
const actorOne: ActorSubclass<_SERVICE> = createNewActor(identityOne, canisterId);
const actorTwo: ActorSubclass<_SERVICE> = createNewActor(identityTwo, canisterId);
const actorThree: ActorSubclass<_SERVICE> = createNewActor(identityThree, canisterId);
const actorFour: ActorSubclass<_SERVICE> = createNewActor(identityFour, canisterId);

const encrypted_symmetric_key = new TextEncoder().encode('mySuperKey'); // just a byte array, no symmetric key
let policy: Policy;

/*
 This test suit tests the functionality around a FixedDateTime policy.
 */

beforeAll(async () => {
    await createIoloUsersInBackend([actorOne, actorTwo, actorThree]);
    const secretA = await createSecretInBackend('A', actorOne);
    const secretB = await createSecretInBackend('B', actorOne);

    // Create Policy
    const addPolicyArgs: CreatePolicyArgs = {
        name: ['mySuperPolicy'],
    }
    const resultAddPolicy: Result_2 = await actorOne.create_policy(addPolicyArgs);
    expect(resultAddPolicy).toHaveProperty('Ok');
    policy = resultAddPolicy['Ok'];

    // Create condition
    const fixedDateTimeCondition: UpdateFixedDateTimeCondition = {
        id: [],
        datetime: BigInt((Date.now() + 30 * 1000) * 1000000), // now + 30 secs, in nanoseconds
    }

    // Update Policy
    let updatePolicyArgs: UpdatePolicyArgs = {
        id: policy.id,
        name: policy.name,
        beneficiaries: [identityTwo.getPrincipal().toString(), identityThree.getPrincipal().toString()],
        conditions: [{'FixedDateTime': fixedDateTimeCondition}],
        conditions_logical_operator: [],
        secrets: [secretA.id, secretB.id],
        key_box: [[secretA.id, new Uint8Array([1, 2, 3])], [secretB.id, new Uint8Array([4, 5, 6])]],
    }
    let resultUpdatePolicy: Result_2 = await actorOne.update_policy(updatePolicyArgs);
    console.log(resultUpdatePolicy)
    expect(resultUpdatePolicy).toHaveProperty('Ok');
    policy = resultUpdatePolicy['Ok'];

}, 60000);

describe("FixedDateTime Policy", () => {
    test("check FixedDateTime state BEFORE defined timestamp", async () => {

        // actor one must have the policy in his list as owner
        let resultActorOneListOwner: Result_10 = await actorOne.get_policy_list_as_owner();
        expect(resultActorOneListOwner).toHaveProperty('Ok');
        expect(resultActorOneListOwner['Ok']).toHaveLength(1);
        expect(resultActorOneListOwner['Ok'][0].conditions_status).toStrictEqual(false);

        // actor one must NOT have the policy in his list as beneficiary
        let resultActorOneListBeneficiary = await actorOne.get_policy_list_as_beneficiary();
        expect(resultActorOneListBeneficiary).toHaveProperty('Ok');
        expect(resultActorOneListBeneficiary['Ok']).toHaveLength(0);

        // actor two must have the policy in his list as beneficiary
        let resultActorTwoList: Result_10 = await actorTwo.get_policy_list_as_beneficiary();
        expect(resultActorTwoList).toHaveProperty('Ok');
        expect(resultActorTwoList['Ok']).toHaveLength(1);
        expect(resultActorTwoList['Ok'][0].conditions_status).toStrictEqual(false);

        // actor three must have the policy in his list as beneficiary
        let resultActorThreeList: Result_10 = await actorThree.get_policy_list_as_beneficiary();
        expect(resultActorThreeList).toHaveProperty('Ok');
        expect(resultActorThreeList['Ok']).toHaveLength(1);
        expect(resultActorThreeList['Ok'][0].conditions_status).toStrictEqual(false);

        // actor four must NOT have the policy in his list as beneficiary
        let resultActorFourList: Result_10 = await actorFour.get_policy_list_as_beneficiary();
        expect(resultActorFourList).toHaveProperty('Ok');
        expect(resultActorFourList['Ok']).toHaveLength(0);

        // actor one must see the policy as owner
        let resultActorOnePolicy: Result_8 = await actorOne.get_policy_as_owner(policy.id);
        expect(resultActorOnePolicy).toHaveProperty('Ok');

        // actor two must NOT YET see the policy as beneficiary
        let resultActorTwoPolicy: Result_8 = await actorTwo.get_policy_as_beneficiary(policy.id);
        expect(resultActorTwoPolicy).toHaveProperty('Err');
        expect(resultActorTwoPolicy['Err']).toHaveProperty('InvalidPolicyCondition');

        // actor three must NOT YET see the policy as beneficiary
        let resultActorThreePolicy: Result_8 = await actorThree.get_policy_as_beneficiary(policy.id);
        expect(resultActorThreePolicy).toHaveProperty('Err');
        expect(resultActorThreePolicy['Err']).toHaveProperty('InvalidPolicyCondition');

        // actor four must NOT see the policy as beneficiary
        let resultActorFourPolicy: Result_8 = await actorFour.get_policy_as_beneficiary(policy.id);
        expect(resultActorFourPolicy).toHaveProperty('Err');
        expect(resultActorFourPolicy['Err']).toHaveProperty('NoPolicyForBeneficiary');

    }, 60000); // Set timeout

    test("check FixedDateTime state AFTER defined timestamp", async () => {

        await new Promise(resolve => setTimeout(resolve, 120000));  // Wait for 2 minutes to be sure policy state is updated (cron job every 60 secs in backend)

        // actor one must still have the policy in his list as owner
        let resultActorOneListOwner: Result_10 = await actorOne.get_policy_list_as_owner();
        expect(resultActorOneListOwner).toHaveProperty('Ok');
        expect(resultActorOneListOwner['Ok']).toHaveLength(1);
        expect(resultActorOneListOwner['Ok'][0].conditions_status).toStrictEqual(true);

        // actor one must still NOT have the policy in his list as beneficiary
        let resultActorOneListBeneficiary = await actorOne.get_policy_list_as_beneficiary();
        expect(resultActorOneListBeneficiary).toHaveProperty('Ok');
        expect(resultActorOneListBeneficiary['Ok']).toHaveLength(0);

        // actor two must have the policy in his list as beneficiary
        let resultActorTwoList: Result_10 = await actorTwo.get_policy_list_as_beneficiary();
        expect(resultActorTwoList).toHaveProperty('Ok');
        expect(resultActorTwoList['Ok']).toHaveLength(1);
        expect(resultActorTwoList['Ok'][0].conditions_status).toStrictEqual(true);

        // actor three must have the policy in his list as beneficiary
        let resultActorThreeList: Result_10 = await actorThree.get_policy_list_as_beneficiary();
        expect(resultActorThreeList).toHaveProperty('Ok');
        expect(resultActorThreeList['Ok']).toHaveLength(1);
        expect(resultActorThreeList['Ok'][0].conditions_status).toStrictEqual(true);

        // actor four must NOT have the policy in his list as beneficiary
        let resultActorFourList: Result_10 = await actorFour.get_policy_list_as_beneficiary();
        expect(resultActorFourList).toHaveProperty('Ok');
        expect(resultActorFourList['Ok']).toHaveLength(0);

        // actor one must see the policy as owner
        let resultActorOnePolicy: Result_8 = await actorOne.get_policy_as_owner(policy.id);
        expect(resultActorOnePolicy).toHaveProperty('Ok');

        // actor two must see the policy as beneficiary
        let resultActorTwoPolicy: Result_8 = await actorTwo.get_policy_as_beneficiary(policy.id);
        expect(resultActorTwoPolicy).toHaveProperty('Ok');
        expect(resultActorTwoPolicy['Ok'].conditions_status).toStrictEqual(true);
        expect(resultActorTwoPolicy['Ok'].conditions[0].FixedDateTime.condition_status).toStrictEqual(true);

        // actor three must see the policy as beneficiary
        let resultActorThreePolicy: Result_8 = await actorThree.get_policy_as_beneficiary(policy.id);
        expect(resultActorThreePolicy).toHaveProperty('Ok');
        expect(resultActorThreePolicy['Ok'].conditions_status).toStrictEqual(true);
        expect(resultActorThreePolicy['Ok'].conditions[0].FixedDateTime.condition_status).toStrictEqual(true);

        // actor four must NOT see the policy as beneficiary
        let resultActorFourPolicy: Result_8 = await actorFour.get_policy_as_beneficiary(policy.id);
        expect(resultActorFourPolicy).toHaveProperty('Err');
        expect(resultActorFourPolicy['Err']).toHaveProperty('NoPolicyForBeneficiary');

        // TODO: decrypt the secrets and check if they are correct


    }, 180000); // Set timeout

});