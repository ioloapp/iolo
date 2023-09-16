import {ActorSubclass, HttpAgent, Identity} from "@dfinity/agent";
import {
    _SERVICE,
    AddSecretArgs,
    Result,
    Result_2,
    Result_5,
    Secret,
    SecretListEntry,
    User
} from "../../../declarations/iccrypt_backend/iccrypt_backend.did";
import {AuthClient} from "@dfinity/auth-client";
import {createActor} from "../../../declarations/iccrypt_backend";
import {mapError} from "../utils/errorMapper";
import {ICCryptError} from "../error/Errors";
import {Principal} from "@dfinity/principal";

class IcCryptService {
    static instance: IcCryptService;
    private authClient: AuthClient;
    private identity: Identity;
    private agent: HttpAgent
    private actor: ActorSubclass<_SERVICE>;

    constructor() {
        if (IcCryptService.instance) {
            return IcCryptService.instance;
        }
        IcCryptService.instance = this;
        void this.initClient();
    }

    private async initClient() {
        this.authClient = await AuthClient.create();
        this.identity = this.authClient.getIdentity();
        this.agent = new HttpAgent({identity: this.identity});
        this.actor = createActor(process.env.ICCRYPT_BACKEND_CANISTER_ID, {
            agent: this.agent,
        });
    }

    public getActor() {
        return this.actor;
    }

    public async login(): Promise<Principal> {
        const daysToAdd = 7;
        const expiry = Date.now() + (daysToAdd * 86400000);
        await this.authClient.login({
            onSuccess: async () => {
                console.log('login successful')
            },
            onError: async () => {
                throw new ICCryptError();
            },
            identityProvider: process.env.II_URL,
            maxTimeToLive: BigInt(expiry * 1000000)
        });
        return this.getUserPrincipal();
    }

    public async getUserPrincipal(): Promise<Principal> {
        return this.authClient.getIdentity().getPrincipal();
    }

    public async createUser(): Promise<User> {
        const result: Result_2 = await this.actor.create_user();
        if (result['OK']) {
            return result['OK']
        }
        throw mapError(result['Err']);
    }

    public async deleteUser(): Promise<User> {
        const result: Result_2 = await this.actor.delete_user();
        if (result['OK']) {
            return result['OK']
        }
        throw mapError(result['Err']);
    }

    public async getSecretList(): Promise<SecretListEntry[]> {
        const result: Result_5 = await this.actor.get_secret_list();
        if (result['OK']) {
            return result['OK']
        }
        throw mapError(result['Err']);
    }

    public async addSecret(secret: Secret): Promise<SecretListEntry[]> {
        const request: AddSecretArgs = {
            secret: {
                ...secret,
                date_created: BigInt(new Date().getDate()),
                date_modified: BigInt(new Date().getDate())
            },
            decryption_material: undefined
        }
        const result: Result = await this.actor.add_secret(request);
        if (result['OK']) {
            return result['OK']
        }
        throw mapError(result['Err']);
    }

    public async deleteSecret(secretId: bigint) {
        const result: Result_2 = await this.actor.remove_user_secret(`${secretId}`);
        if (result['OK']) {
            return result['OK']
        }
        throw mapError(result['Err']);
    }

    public async isUserVaultExisting(): Promise<boolean> {
        return await this.actor.is_user_vault_existing();
    }
}

export default IcCryptService;
