import {ActorSubclass, HttpAgent, Identity} from "@dfinity/agent";
import {
    _SERVICE,
    AddSecretArgs,
    Result,
    Result_2,
    Result_5,
    SecretCategory,
    SecretDecryptionMaterial,
    SecretListEntry,
    User
} from "../../../declarations/iccrypt_backend/iccrypt_backend.did";
import {AuthClient} from "@dfinity/auth-client";
import {createActor} from "../../../declarations/iccrypt_backend";
import {mapError} from "../utils/errorMapper";
import {ICCryptError} from "../error/Errors";
import {Principal} from "@dfinity/principal";
import {aes_gcm_encrypt, get_aes_256_gcm_key_for_uservault, get_local_random_aes_256_gcm_key} from "../utils/crypto";
import {UiSecret, UiSecretCategory} from "./IcTypesForUi";

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
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    public async deleteUser(): Promise<User> {
        const result: Result_2 = await this.actor.delete_user();
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    public async getSecretList(): Promise<SecretListEntry[]> {
        const result: Result_5 = await this.actor.get_secret_list();
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    public async addSecret(secret: UiSecret): Promise<SecretListEntry> {
        console.log('start adding')
        const encryptedSecret = await this.encryptSecret(secret)
        console.log('encryptedSecret', encryptedSecret)
        const result: Result = await this.actor.add_secret(encryptedSecret);
        console.log('result2', result)
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    private async encryptSecret(secret: UiSecret): Promise<AddSecretArgs> {
        try {
            const secret_encryption_key = await get_local_random_aes_256_gcm_key();

            // Encrypt secret fields
            const encrypted_username = await aes_gcm_encrypt(secret.username, secret_encryption_key);
            const encrypted_password = await aes_gcm_encrypt(secret.password, secret_encryption_key);
            const encrypted_notes = await aes_gcm_encrypt(secret.notes, secret_encryption_key);

            // Encrypt the encryption key
            const uservault_encryption_key = await get_aes_256_gcm_key_for_uservault();
            const encrypted_secret_decryption_key = await aes_gcm_encrypt(secret_encryption_key, uservault_encryption_key);

            let decryption_material: SecretDecryptionMaterial = {
                encrypted_decryption_key: encrypted_secret_decryption_key.ciphertext,
                iv: encrypted_secret_decryption_key.nonce,
                username_decryption_nonce: [encrypted_username.ciphertext],
                password_decryption_nonce: [encrypted_password.ciphertext],
                notes_decryption_nonce: [encrypted_notes.ciphertext],
            };

            const encryptedSecret: AddSecretArgs = {
                secret: {
                    id: secret.id,
                    url: [secret.url],
                    name: [secret.name],
                    category: [this.getSecretCategory(secret.category)],
                    username: [encrypted_username.ciphertext],
                    password: [encrypted_password.ciphertext],
                    notes: [encrypted_notes.ciphertext],
                    date_created: BigInt(new Date().getDate()),
                    date_modified: BigInt(new Date().getDate())
                },
                decryption_material
            }
            console.log('encrypted secret to add: ', encryptedSecret)
            return encryptedSecret
        } catch (e) {
            console.error(e)
        }
    }

    private getSecretCategory(uiCategory: UiSecretCategory): SecretCategory {
        switch (uiCategory) {
            case UiSecretCategory.Password:
                return {'Password': null}
            case UiSecretCategory.Note:
                return {'Note': null}
            case UiSecretCategory.Document:
                return {'Document': null}
        }
    }

    public async deleteSecret(secretId: bigint) {
        const result: Result_2 = await this.actor.remove_user_secret(`${secretId}`);
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    public async isUserVaultExisting(): Promise<boolean> {
        return await this.actor.is_user_vault_existing();
    }
}

export default IcCryptService;
