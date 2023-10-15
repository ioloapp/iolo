import {ActorSubclass, HttpAgent, Identity} from "@dfinity/agent";
import {
    _SERVICE,
    AddSecretArgs,
    Result,
    Result_1,
    Result_2,
    Result_4,
    Result_5,
    Result_6,
    Secret,
    SecretCategory,
    SecretDecryptionMaterial,
    SecretListEntry,
    Testament,
    User
} from "../../../declarations/iccrypt_backend/iccrypt_backend.did";
import {AuthClient} from "@dfinity/auth-client";
import {createActor} from "../../../declarations/iccrypt_backend";
import {mapError} from "../utils/errorMapper";
import {ICCryptError} from "../error/Errors";
import {Principal} from "@dfinity/principal";
import {
    aes_gcm_decrypt,
    aes_gcm_encrypt,
    get_aes_256_gcm_key_for_uservault,
    get_local_random_aes_256_gcm_key
} from "../utils/crypto";
import {UiSecret, UiSecretCategory, UiUser} from "./IcTypesForUi";
import {v4 as uuidv4} from 'uuid';

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
                const principal = await this.getUserPrincipal();
                console.log('login successful with principal ', principal.toString());
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
            return result['Ok'].flatMap(f => f ? [f] : []);
        }
        throw mapError(result['Err']);
    }

    public async addSecret(uiSecret: UiSecret): Promise<Secret> {
        console.log('start adding secret...')
        const encryptedSecret: AddSecretArgs = await this.encryptNewSecret(uiSecret)
        const result: Result = await this.actor.add_secret(encryptedSecret);
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    public async updateSecret(uiSecret: UiSecret): Promise<Secret> {
        console.log('start updating secret...')
        const resultDecryptionMaterial: Result_4 = await this.actor.get_secret_decryption_material(uiSecret.id);

        let decryptionMaterial: SecretDecryptionMaterial;
        if (resultDecryptionMaterial['Ok']) {
            decryptionMaterial = resultDecryptionMaterial['Ok'];
        } else {
            throw mapError(resultDecryptionMaterial['Err']);
        }

        // Get the vetKey to decrypt the encryption key
        const uservaultEncryptionKey: Uint8Array = await get_aes_256_gcm_key_for_uservault();

        // Decrypt encryption key
        const decryptedEncryptionKey = await aes_gcm_decrypt(decryptionMaterial.encrypted_decryption_key as Uint8Array, uservaultEncryptionKey);

        // Encrypt updated secret
        const encryptedSecret: Secret = await this.encryptExistingSecret(uiSecret, decryptedEncryptionKey, decryptionMaterial.username_decryption_nonce[0] as Uint8Array, decryptionMaterial.password_decryption_nonce[0] as Uint8Array, decryptionMaterial.notes_decryption_nonce[0] as Uint8Array);

        // Update encrypted secret
        const resultUpdate: Result = await this.actor.update_secret(encryptedSecret);

        if (resultUpdate['Ok']) {
            return resultUpdate['Ok']
        }
        throw mapError(resultUpdate['Err']);
    }

    private async encryptNewSecret(uiSecret: UiSecret): Promise<AddSecretArgs> {
        // When creating new secrets no encryption key and no ivs are provided, they are generated new
        try {
            // Encrypt the encryption key
            const encryptionKey = await get_local_random_aes_256_gcm_key();
            const ivEncryptionKey = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
            const uservaultEncryptionKey = await get_aes_256_gcm_key_for_uservault();
            const encryptedEncryptionKey = await aes_gcm_encrypt(encryptionKey, uservaultEncryptionKey, ivEncryptionKey);

            // Encrypt optional secret attributes
            let ivUsername = new Uint8Array(0);;
            let encryptedUsername = new Uint8Array(0);
            if (uiSecret.username) {
                ivUsername = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                encryptedUsername = await aes_gcm_encrypt(uiSecret.username, encryptionKey, ivUsername);
            }
            let ivPassword = new Uint8Array(0);;
            let encryptedPassword = new Uint8Array(0);
            if (uiSecret.password) {
                ivPassword = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                encryptedPassword = await aes_gcm_encrypt(uiSecret.password, encryptionKey, ivPassword);
            }
            let ivNotes = new Uint8Array(0);;
            let encryptedNotes = new Uint8Array(0);
            if (uiSecret.notes) {
                ivNotes = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                encryptedNotes = await aes_gcm_encrypt(uiSecret.notes, encryptionKey, ivNotes);
            }

            let decryptionMaterial: SecretDecryptionMaterial = {
                encrypted_decryption_key: encryptedEncryptionKey,
                iv: ivEncryptionKey,
                username_decryption_nonce: [ivUsername],
                password_decryption_nonce: [ivPassword],
                notes_decryption_nonce: [ivNotes],
            };

            const encryptedSecret: AddSecretArgs = {
                    id: uuidv4(),
                    url: uiSecret.url ? [uiSecret.url]: [],
                    name: [uiSecret.name],
                    category: [this.getSecretCategory(uiSecret.category)],
                    username: [encryptedUsername],
                    password: [encryptedPassword],
                    notes: [encryptedNotes],
                    decryption_material: decryptionMaterial
            }
            console.log('encrypted secret to add: ', encryptedSecret)
            return encryptedSecret
        } catch (e) {
            throw mapError(e)
        }
    }

    private async encryptExistingSecret(uiSecret: UiSecret, encryptionKey:  Uint8Array, ivUsername: Uint8Array, ivPassword: Uint8Array, ivNotes: Uint8Array): Promise<Secret> {
        // When updating existing secrets the existing encryption key and the existing ivs must be used

        try {

            // Encrypt optional secret attributes
            let encryptedUsername = new Uint8Array(0);
            if (uiSecret.username) {
                encryptedUsername = await aes_gcm_encrypt(uiSecret.username, encryptionKey, ivUsername);
            }
            let encryptedPassword = new Uint8Array(0);
            if (uiSecret.password) {
                encryptedPassword = await aes_gcm_encrypt(uiSecret.password, encryptionKey, ivPassword);
            }
            let encryptedNotes = new Uint8Array(0);
            if (uiSecret.notes) {
                encryptedNotes = await aes_gcm_encrypt(uiSecret.notes, encryptionKey, ivNotes);
            }
            const encryptedSecret: Secret = {
                id: uiSecret.id,
                url: uiSecret.url ? [uiSecret.url] : [],
                name: [uiSecret.name],
                category: [this.getSecretCategory(uiSecret.category)],
                username: [encryptedUsername],
                password: [encryptedPassword],
                notes: [encryptedNotes],
                date_created: 0n, // will be ignored by update_secret function in backend
                date_modified: 0n // will be ignored by update_secret function in backend
            }
            console.log('encrypted secret to update: ', encryptedSecret)
            return encryptedSecret
        } catch (e) {
            throw mapError(e)
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

    public async deleteSecret(secretId: string) {
        const result: Result_2 = await this.actor.remove_user_secret(secretId);
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    public async isUserVaultExisting(): Promise<boolean> {
        return await this.actor.is_user_vault_existing();
    }

    async addTestament(testament: Testament): Promise<Testament> {
        const initialTestament = await this.actor.add_testament({id: uuidv4()});
        //TODO encrypt testament
        const encryptedTestament = {
            ...testament,
            id: uuidv4()
        }
        const result: Result_1 = await this.actor.update_testament(encryptedTestament);
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    async getTestamentList(): Promise<Testament[]> {
        const result: Result_6 = await this.actor.get_testament_list();
        if (result['Ok']) {
            return result['Ok'].flatMap(f => f ? [f] : []);
        }
        throw mapError(result['Err']);
    }

    async updateTestament(testament: Testament): Promise<Testament> {
        //TODO
        return testament;
    }

    async deleteTestament(id: string) {
        //TODO
    }

    async addHeir(heir: UiUser): Promise<UiUser> {
        //TODO
        return heir;
    }

    async getHeirsList(): Promise<UiUser[]> {
        //TODO
        return []
    }

    async updateHeir(heir: UiUser): Promise<UiUser> {
        return heir;
    }

    async deleteHeir(id: string) {
        //TODO
    }

}

export default IcCryptService;
