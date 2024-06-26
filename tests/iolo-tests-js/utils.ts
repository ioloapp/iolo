import {execSync} from 'child_process';
import {Secp256k1KeyIdentity} from '@dfinity/identity-secp256k1';
import {ActorSubclass, HttpAgent} from "@dfinity/agent";
import {createActor, } from "../../src/declarations/iolo_backend";
import {
    AddOrUpdateUserArgs, CreateSecretArgs, Secret, Result_3, _SERVICE
} from "../../src/declarations/iolo_backend/iolo_backend.did";

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

export function createNewActor(identity: Secp256k1KeyIdentity, canisterId: string): ActorSubclass<_SERVICE> {
    // Create agent
    const agent: HttpAgent = new HttpAgent({identity: identity, host: "http://127.0.0.1:4943"});

    // Create actor
    let actor: ActorSubclass<_SERVICE>;
    actor = createActor(canisterId, {
        agent: agent,
    });
    return actor;
}

export async function createIoloUsersInBackend(actors: Array<ActorSubclass<_SERVICE>>) {
    if (actors.length > 4) {
        throw new Error('Maximum 4 users possible currently!');
    }

    const users = [
        { name: 'Alice', email: 'alice@ioloapp.io'},
        { name: 'Bob', email: 'bob@ioloapp.io'},
        { name: 'Charlie', email: 'charlie@ioloapp.io'},
        { name: 'David', email: 'david@ioloapp.io'},
    ];
    
    const promises = actors.map((actor, i) => {
        const addOrUpdateUserArgs: AddOrUpdateUserArgs = {
            name: [users[i].name],
            email: [users[i].email],
            user_type: [{ 'Person': null }],
        };
        return actor.create_user(addOrUpdateUserArgs);
    });

    const results = await Promise.all(promises);

    // Check results and handle any errors
    results.forEach((result, index) => {
        if (!result['Ok']) {
            throw new Error(`User creation failed for ${users[index].name}`);
        }
    });
}

export async function createSecretInBackend(prefix: string, actor: ActorSubclass<_SERVICE>): Promise<Secret> {
    const encrypted_symmetric_key = new TextEncoder().encode('mySuperKey'); // just a byte array, no symmetric key

    let addSecretArgsOne: CreateSecretArgs = {
        name: ['secret' + prefix],
        url: ['https://www.secret' + prefix + '.com'],
        category: [{'Password': null}],
        username: [new TextEncoder().encode('user' + prefix)], // arbitrary byte array
        password: [new TextEncoder().encode('password' + prefix)], // arbitrary byte array
        notes: [new TextEncoder().encode('notes' + prefix)], // arbitrary byte array
        encrypted_symmetric_key: encrypted_symmetric_key,
    }


    const result: Result_3 = await actor.create_secret(addSecretArgsOne);
    if (!result['Ok']) {
        throw new Error(`Secret creation failed: ${result['Err']}`);
    }
    return result['Ok'];
}