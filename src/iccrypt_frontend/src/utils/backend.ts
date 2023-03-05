import { HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { iccrypt_backend, createActor } from "../../../declarations/iccrypt_backend";


export async function getActor () {
    let authClient = await AuthClient.create();
    let identity = authClient.getIdentity();
    let actor = iccrypt_backend;
    const agent = new HttpAgent({ identity });
    actor = createActor(process.env.ICCRYPT_BACKEND_CANISTER_ID, {
        agent,
    });
    return actor;
}