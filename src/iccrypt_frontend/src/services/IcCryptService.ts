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
    SecretSymmetricCryptoMaterial,
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
import {UiSecret, UiSecretCategory, UiTestament, UiUser} from "./IcTypesForUi";
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
        const result: Result_4 = await this.actor.get_secret_list();
        if (result['Ok']) {
            return result['Ok'].flatMap(f => f ? [f] : []);
        }
        throw mapError(result['Err']);
    }

    public async getSecret(secretId: string): Promise<UiSecret> {
        console.log('start getting secret...')
        const result1 = this.actor.get_secret(secretId);
        const result2 = this.actor.get_secret_symmetric_crypto_material(secretId);

        // Wait for both promises to complete
        const [value1, value2] = await Promise.all([result1, result2]);

        // Now you can use value1 and value2
        if (value1['Ok']) {
            // Get the vetKey to decrypt the encryption key
            const uservaultVetKey: Uint8Array = await get_aes_256_gcm_key_for_uservault();

            // Decrypt symmetric key
            const decryptedSymmetricKey = await aes_gcm_decrypt(value2['Ok'].encrypted_symmetric_key as Uint8Array, uservaultVetKey, value2['Ok'].iv);

            // Decrypt attributes
            let decryptedUsername = undefined;
            if (value1['Ok'].username[0].length > 0) {
                decryptedUsername = await aes_gcm_decrypt(value1['Ok'].username[0], decryptedSymmetricKey, value2['Ok'].username_decryption_nonce[0]);
            }

            let decryptedPassword = undefined;
            if (value1['Ok'].password[0].length > 0) {
                decryptedPassword = await aes_gcm_decrypt(value1['Ok'].password[0], decryptedSymmetricKey, value2['Ok'].password_decryption_nonce[0]);
            }
            let decryptedNotes = undefined;
            if (value1['Ok'].notes[0].length > 0) {
                decryptedNotes = await aes_gcm_decrypt(value1['Ok'].notes[0], decryptedSymmetricKey, value2['Ok'].notes_decryption_nonce[0]);
            }

            let category: UiSecretCategory = null;
            if (value1['Ok'].category[0].hasOwnProperty(UiSecretCategory.Password)) {
                category = UiSecretCategory.Password;
            } else if (value1['Ok'].category[0].hasOwnProperty(UiSecretCategory.Document)) {
                category = UiSecretCategory.Document;
            } else if (value1['Ok'].category[0].hasOwnProperty(UiSecretCategory.Note)) {
                category = UiSecretCategory.Note;
            }

            return {
                id: value1['Ok'].id,
                name: value1['Ok'].name[0],
                category: category,
                url: value1['Ok'].url[0],
                username: new TextDecoder().decode(decryptedUsername),
                password: new TextDecoder().decode(decryptedPassword),
                notes: new TextDecoder().decode(decryptedNotes),
                date_created: new Date(Number(value1['Ok'].date_created / BigInt(1000000))),
                date_modified: new Date(Number(value1['Ok'].date_modified / BigInt(1000000))),
            }
        } else throw mapError(value1['Err']);
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
        const resultSymmetricCryptoMaterial: Result_5 = await this.actor.get_secret_symmetric_crypto_material(uiSecret.id);
        let symmetricCryptoMaterial: SecretSymmetricCryptoMaterial;
        if (resultSymmetricCryptoMaterial['Ok']) {
            symmetricCryptoMaterial = resultSymmetricCryptoMaterial['Ok'];
        } else {
            throw mapError(resultSymmetricCryptoMaterial['Err']);
        }

        // Get the vetKey to decrypt the encryption key
        const uservaultVetKey: Uint8Array = await get_aes_256_gcm_key_for_uservault();

        // Decrypt symmetric key
        const decryptedSymmetricKey = await aes_gcm_decrypt(symmetricCryptoMaterial.encrypted_symmetric_key as Uint8Array, uservaultVetKey, symmetricCryptoMaterial.iv as Uint8Array);

        // Encrypt updated secret
        const encryptedSecret: Secret = await this.encryptExistingSecret(uiSecret, decryptedSymmetricKey, symmetricCryptoMaterial.username_decryption_nonce[0] as Uint8Array, symmetricCryptoMaterial.password_decryption_nonce[0] as Uint8Array, symmetricCryptoMaterial.notes_decryption_nonce[0] as Uint8Array);

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
            // Encrypt the symmetric key
            const symmetricKey = await get_local_random_aes_256_gcm_key();
            const ivSymmetricKey = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
            const uservaultVetKey = await get_aes_256_gcm_key_for_uservault();
            const encryptedSymmetricKey = await aes_gcm_encrypt(symmetricKey, uservaultVetKey, ivSymmetricKey);

            // Encrypt optional secret attributes
            let ivUsername = new Uint8Array(0);;
            let encryptedUsername = new Uint8Array(0);
            if (uiSecret.username) {
                ivUsername = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                encryptedUsername = await aes_gcm_encrypt(uiSecret.username, symmetricKey, ivUsername);
            }
            let ivPassword = new Uint8Array(0);;
            let encryptedPassword = new Uint8Array(0);
            if (uiSecret.password) {
                ivPassword = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                encryptedPassword = await aes_gcm_encrypt(uiSecret.password, symmetricKey, ivPassword);
            }
            let ivNotes = new Uint8Array(0);;
            let encryptedNotes = new Uint8Array(0);
            if (uiSecret.notes) {
                ivNotes = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                encryptedNotes = await aes_gcm_encrypt(uiSecret.notes, symmetricKey, ivNotes);
            }

            let symmetricCryptoMaterial: SecretSymmetricCryptoMaterial = {
                encrypted_symmetric_key: encryptedSymmetricKey,
                iv: ivSymmetricKey,
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
                    symmetric_crypto_material: symmetricCryptoMaterial
            }
            console.log('encrypted secret to add: ', encryptedSecret)
            return encryptedSecret
        } catch (e) {
            throw mapError(e)
        }
    }

    private async encryptExistingSecret(uiSecret: UiSecret, symmetricKey:  Uint8Array, ivUsername: Uint8Array, ivPassword: Uint8Array, ivNotes: Uint8Array): Promise<Secret> {
        // When updating existing secrets the existing encryption key and the existing ivs must be used
        try {

            // Encrypt optional secret attributes
            let encryptedUsername = new Uint8Array(0);
            if (uiSecret.username) {
                encryptedUsername = await aes_gcm_encrypt(uiSecret.username, symmetricKey, ivUsername);
            }
            let encryptedPassword = new Uint8Array(0);
            if (uiSecret.password) {
                encryptedPassword = await aes_gcm_encrypt(uiSecret.password, symmetricKey, ivPassword);
            }
            let encryptedNotes = new Uint8Array(0);
            if (uiSecret.notes) {
                encryptedNotes = await aes_gcm_encrypt(uiSecret.notes, symmetricKey, ivNotes);
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
        const result: Result_2 = await this.actor.remove_secret(secretId);
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);
    }

    public async isUserVaultExisting(): Promise<boolean> {
        return await this.actor.is_user_vault_existing();
    }

    async addTestament(testament: UiTestament): Promise<UiTestament> {
        const heirs = testament.heirs.map((item) => {
            return Principal.fromText(item.id);
        });

        const initialTestament = await this.actor.add_testament({id: testament.id, heirs: heirs, name: [testament.name], secrets: testament.secrets, key_box: null });

        //TODO encrypt testament
        /*const encryptedTestament: Testament = {
            ...testament,
            id: uuidv4()
        }
        const result: Result_1 = await this.actor.update_testament(encryptedTestament);
        if (result['Ok']) {
            return result['Ok']
        }
        throw mapError(result['Err']);

         */
        return null;

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
