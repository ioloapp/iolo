import {execSync} from 'child_process';
import {Secp256k1KeyIdentity} from '@dfinity/identity-secp256k1';
import {HttpAgent} from "@dfinity/agent";
import {createActor, } from "../../src/declarations/iolo_backend";
import {
    Result,
    AddOrUpdateUserArgs, SecretSymmetricCryptoMaterial, AddSecretArgs, SecretCategory, Result_2
} from "../../src/declarations/iolo_backend/iolo_backend.did";
import {Secret} from "../../.dfx/local/canisters/iolo_backend/service.did";

export function determineBackendCanisterId(): string {
    let canisterId: string = null;
    try {
        // Execute the Bash script synchronously
        canisterId = execSync('dfx canister id iolo_backend', { encoding: 'utf-8' });
        canisterId = canisterId.replace(/\s+/g, ""); // Remove line break
    } catch (error) {
        console.error(`Script Error: ${error.message}`);
        process.exit(1);
    }
    return canisterId;
}

export function createIdentity(seed?: string): Secp256k1KeyIdentity {
    if (seed) {
        return Secp256k1KeyIdentity.fromSeedPhrase(seed);
    } else {
        return Secp256k1KeyIdentity.generate();
    }
}

export function createNewActor(identity: Secp256k1KeyIdentity, canisterId: string) {
    // Create agent
    const agent: HttpAgent = new HttpAgent({identity: identity, host: "http://127.0.0.1:4943"});

    // Create actor
    let actor;
    actor = createActor(canisterId, {
        agent: agent,
    });
    return actor;
}

export async function createAliceAndBob(actorOne, actorTwo) {
    const users = [
        { name: 'Alice', email: 'alice@ioloapp.io', actor: actorOne },
        { name: 'Bob', email: 'bob@ioloapp.io', actor: actorTwo },
    ];

    for (const { name, email, actor } of users) {
        const addOrUpdateUserArgs: AddOrUpdateUserArgs = {
            name: [name],
            email: [email],
            user_type: [{ 'Person': null }],
        };
        const result: Result = await actor.create_user(addOrUpdateUserArgs);
        if (!result['Ok']) {
            throw new Error(`User creation failed for ${name}`);
        }
    }
}

export async function createSecret(prefix: string,  actor): Promise<Secret> {
    const symmetricCryptoMaterial: SecretSymmetricCryptoMaterial = {
        encrypted_symmetric_key: new TextEncoder().encode('mySuperKey'), // just a byte array, no symmetric key
    };
    let addSecretArgsOne: AddSecretArgs = {
        name: ['secret' + prefix],
        url: ['https://www.secret' + prefix + '.com'],
        category: [{'Password': null}],
        username: [new TextEncoder().encode('user' + prefix)], // arbitrary byte array
        password: [new TextEncoder().encode('password' + prefix)], // arbitrary byte array
        notes: [new TextEncoder().encode('notes' + prefix)], // arbitrary byte array
        symmetric_crypto_material: symmetricCryptoMaterial,
    }


    const result: Result_2 = await actor.add_secret(addSecretArgsOne);
    if (!result['Ok']) {
        throw new Error(`Secret creation failed: ${result['Err']}`);
    }
    return result['Ok'];
}