import {execSync} from 'child_process';
import {Secp256k1KeyIdentity} from '@dfinity/identity-secp256k1';
import {HttpAgent} from "@dfinity/agent";
import {createActor, } from "../../src/declarations/iolo_backend";


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
