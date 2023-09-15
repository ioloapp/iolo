import {ActorSubclass, HttpAgent, Identity} from "@dfinity/agent";
import {
    _SERVICE,
    AddSecretArgs,
    Result,
    Result_2,
    Result_5,
    SecretListEntry,
    User
} from "../../../declarations/iccrypt_backend/iccrypt_backend.did";
import {AuthClient} from "@dfinity/auth-client";
import {createActor} from "../../../declarations/iccrypt_backend";
import {mapError} from "../utils/errorMapper";
import {ICCryptError} from "../error/Errors";

class IcCryptService {
    static instance;
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

    public async login(loginSuccessAction: (principal: string) => void) {
        const daysToAdd = 7;
        const expiry = Date.now() + (daysToAdd * 86400000);
        await this.authClient.login({
            onSuccess: async () => {
                loginSuccessAction(await this.getUserPrincipal());
            },
            onError: async () => {
                throw new ICCryptError();
            },
            identityProvider: process.env.II_URL,
            maxTimeToLive: BigInt(expiry * 1000000)
        });
        return false;
    }

    public async getUserPrincipal(): Promise<string> {
        return this.authClient.getIdentity().getPrincipal().toText();
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

    public async addSecret(secret: any): Promise<SecretListEntry[]> {
        //TODO add frontend mapping with type
        const request: AddSecretArgs = {
            secret: {
                id: "",
                url: [],
                username: [],
                date_created: 0n,
                password: [],
                name: [],
                notes: [],
                category: [],
                date_modified: 0n
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
