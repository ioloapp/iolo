import {ActorSubclass, HttpAgent, Identity} from "@dfinity/agent";
import {
    _SERVICE,
    AddSecretArgs,
    AddTestamentArgs,
    AddUserArgs,
    Result,
    Result_1,
    Result_3,
    Result_5,
    Result_6,
    Result_7,
    Result_8,
    Result_9,
    Secret,
    SecretCategory,
    SecretListEntry,
    SecretSymmetricCryptoMaterial,
    Testament,
    TestamentListEntry,
    TestamentResponse,
    User,
    UserType
} from "../../../declarations/iccrypt_backend/iccrypt_backend.did";
import {AuthClient} from "@dfinity/auth-client";
import {createActor} from "../../../declarations/iccrypt_backend";
import {mapError} from "../utils/errorMapper";
import {ICCryptError} from "../error/Errors";
import {Principal} from "@dfinity/principal";
import {
    aes_gcm_decrypt,
    aes_gcm_encrypt,
    get_aes_256_gcm_key_for_testament,
    get_aes_256_gcm_key_for_uservault,
    get_local_random_aes_256_gcm_key
} from "../utils/crypto";
import {
    UiSecret,
    UiSecretCategory,
    UiSecretListEntry,
    UiTestament,
    UiTestamentListEntry,
    UiTestamentListEntryRole,
    UiTestamentResponse,
    UiUser,
    UiUserType
} from "./IcTypesForUi";
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

    private async getActor(){
        if(this.actor){
            return this.actor;
        }
        try{
            await this.initClient();
            return this.actor;
        }catch (e) {
            throw new ICCryptError("User not logged in");
        }
    }

    public async login(): Promise<Principal> {
        const daysToAdd = 7;
        const expiry = Date.now() + (daysToAdd * 86400000);

        // Wrap the authClient.login method in a promise
        await new Promise<void>((resolve, reject) => {
            this.authClient.login({
                onSuccess: async () => {
                    this.identity = this.authClient.getIdentity();
                    this.agent.replaceIdentity(this.identity);
                    console.debug("login with principal ", this.identity.getPrincipal().toString());
                    resolve();  // Resolve the promise
                },
                onError: async () => {
                    reject(new ICCryptError());  // Reject the promise
                },
                identityProvider: process.env.II_URL,
                maxTimeToLive: BigInt(expiry * 1000000)
            });
        });
        return await this.getUserPrincipal();
    }

    public async getUserPrincipal(): Promise<Principal> {
        return this.authClient.getIdentity().getPrincipal();
    }

    public async createUser(): Promise<UiUser> {
        const result: Result = await (await this.getActor()).create_user();
        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async updateUserLoginDate(): Promise<UiUser> {
        let result: Result = await (await this.getActor()).update_user_login_date();
        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async deleteUser(): Promise<void> {
        const result: Result_3 = await (await this.getActor()).delete_user();
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    public async getSecretList(): Promise<UiSecretListEntry[]> {
        const result: Result_6 = await (await this.getActor()).get_secret_list();
        if (result['Ok']) {
            return result['Ok'].map((secretListEntry: SecretListEntry): UiSecretListEntry => {
                return {
                    id: secretListEntry.id,
                    name: secretListEntry.name.length > 0 ? secretListEntry.name[0] : undefined,
                    category: secretListEntry.category.length > 0 ? this.mapSecretCategoryToUiSecretCategory(secretListEntry.category[0]) : undefined,
                };
            });
        }
        throw mapError(result['Err']);
    }

    public async getSecret(secretId: string): Promise<UiSecret> {
        console.debug('start getting secret...')
        const result1 = (await this.getActor()).get_secret(secretId);
        const result2 = (await this.getActor()).get_secret_symmetric_crypto_material(secretId);

        // Wait for both promises to complete
        const [value1, value2] = await Promise.all([result1, result2]);

        // Now you can use value1 and value2
        if (value1['Ok'] && value2['Ok']) {
            // Get the vetKey to decrypt the encryption key
            const uservaultVetKey: Uint8Array = await get_aes_256_gcm_key_for_uservault(await this.getUserPrincipal(), (await this.getActor()));

            return this.mapEncryptedSecretToUiSecret(value1['Ok'], value2['Ok'], uservaultVetKey);
        } else throw mapError(value1['Err']);
    }

    public async getSecretAsHeir(secretId: string, testamentId: string): Promise<UiSecret> {
        console.debug('start getting secret for heir...')
        const result1 = (await this.getActor()).get_secret_as_heir(secretId, testamentId);
        const result2 = (await this.getActor()).get_secret_symmetric_crypto_material_as_heir(secretId, testamentId);

        // Wait for both promises to complete
        const [value1, value2] = await Promise.all([result1, result2]);

        // Now you can use value1 and value2
        if (value1['Ok'] && value2['Ok']) {
            // Get the vetKey to decrypt the encryption key
            const testamentVetKey: Uint8Array = await get_aes_256_gcm_key_for_testament(testamentId, (await this.getActor()));
            return this.mapEncryptedSecretToUiSecret(value1['Ok'], value2['Ok'], testamentVetKey);
        } else throw mapError(value1['Err']);
    }

    public async addSecret(uiSecret: UiSecret): Promise<UiSecret> {
        console.debug('start adding secret...')
        const encryptedSecret: AddSecretArgs = await this.encryptNewSecret(uiSecret)
        const result: Result_1 = await (await this.getActor()).add_secret(encryptedSecret);
        if (result['Ok']) {
            return this.mapSecretToUiSecret(result['Ok'], uiSecret.username, uiSecret.password, uiSecret.notes);
        }
        throw mapError(result['Err']);
    }

    public async updateSecret(uiSecret: UiSecret): Promise<UiSecret> {
        console.debug('start updating secret...')
        const resultSymmetricCryptoMaterial: Result_7 = await (await this.getActor()).get_secret_symmetric_crypto_material(uiSecret.id);

        let symmetricCryptoMaterial: SecretSymmetricCryptoMaterial;
        if (resultSymmetricCryptoMaterial['Ok']) {
            symmetricCryptoMaterial = resultSymmetricCryptoMaterial['Ok'];
        } else {
            throw mapError(resultSymmetricCryptoMaterial['Err']);
        }

        // Get the vetKey to decrypt the encryption key
        const uservaultVetKey: Uint8Array = await get_aes_256_gcm_key_for_uservault(await this.getUserPrincipal(),(await this.getActor()));

        // Decrypt symmetric key
        const decryptedSymmetricKey = await aes_gcm_decrypt(symmetricCryptoMaterial.encrypted_symmetric_key as Uint8Array, uservaultVetKey, symmetricCryptoMaterial.iv as Uint8Array);

        // Encrypt updated secret
        const encryptedSecret: Secret = await this.encryptExistingSecret(uiSecret, decryptedSymmetricKey, symmetricCryptoMaterial.username_decryption_nonce[0] as Uint8Array, symmetricCryptoMaterial.password_decryption_nonce[0] as Uint8Array, symmetricCryptoMaterial.notes_decryption_nonce[0] as Uint8Array);

        // Update encrypted secret
        const resultUpdate: Result_1 = await (await this.getActor()).update_secret(encryptedSecret);

        if (resultUpdate['Ok']) {
            return this.mapSecretToUiSecret(resultUpdate['Ok'], uiSecret.username, uiSecret.password, uiSecret.notes);
        }
        throw mapError(resultUpdate['Err']);
    }

    public async deleteSecret(secretId: string): Promise<void> {
        const result: Result_3 = await (await this.getActor()).remove_secret(secretId);
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    public async isUserVaultExisting(): Promise<boolean> {
        return await (await this.getActor()).is_user_vault_existing();
    }

    public async addTestament(uiTestament: UiTestament): Promise<UiTestament> {
        console.debug('start adding testament...');
        uiTestament.id = uuidv4();
        const testament: Testament = await this.mapUiTestamentToTestament(uiTestament);
        const testamentArgs: AddTestamentArgs = {
            heirs: testament.heirs,
            id: testament.id,
            key_box: testament.key_box,
            name: testament.name,
            secrets: testament.secrets,
            condition_arg: testament.condition_arg
        }

        // Add testament
        const result = await (await this.getActor()).add_testament(testamentArgs);
        if (result['Ok']) {
            return this.mapTestamentToUiTestament(result['Ok'], UiTestamentListEntryRole.Testator);
        } else throw mapError(result['Err']);

    }

    public async updateTestament(uiTestament: UiTestament): Promise<UiTestament> {
        console.debug('start updating testament...')
        const testament: Testament = await this.mapUiTestamentToTestament(uiTestament);

        // Update testament
        const result = await (await this.getActor()).update_testament(testament);
        if (result['Ok']) {
            return this.mapTestamentToUiTestament(result['Ok'], UiTestamentListEntryRole.Testator);
        } else throw mapError(result['Err']);
    }

    public async getTestamentList(): Promise<UiTestamentListEntry[]> {
        const resultAsTestator: Result_9 = await (await this.getActor()).get_testament_list_as_testator();
        let testamentsAsTestator: UiTestamentListEntry[] = [];
        if (resultAsTestator['Ok']) {
            testamentsAsTestator = resultAsTestator['Ok'].map((item: TestamentListEntry): UiTestamentListEntry  => {
                return {
                    id: item.id,
                    name: item.name?.length > 0 ? item.name[0] : undefined,
                    testator: { id: item.testator?.toString()},
                    role: UiTestamentListEntryRole.Testator,
                    conditionStatus: item.condition_status,
                }
            });
        } else throw mapError(resultAsTestator['Err']);

        const resultAsHeir: Result_9 = await (await this.getActor()).get_testament_list_as_heir();
        let testamentsAsHeir: UiTestamentListEntry[] =  [];
        if (resultAsHeir['Ok'] && resultAsHeir['Ok'].length > 0) {
            testamentsAsHeir = resultAsHeir['Ok'].map((item: TestamentListEntry): UiTestamentListEntry  => {
                return {
                    id: item.id,
                    name: item.name?.length > 0 ? item.name[0] : undefined,
                    testator: { id: item.testator?.toString()},
                    role: UiTestamentListEntryRole.Heir,
                    conditionStatus: item.condition_status,
                }
            });
        } else if (resultAsHeir['Err']) {
            throw mapError(resultAsTestator['Err']);
        }
        return testamentsAsTestator.concat(testamentsAsHeir);
    }

    public async getTestamentAsTestator(id: string): Promise<UiTestamentResponse> {
        const result: Result_8 = await (await this.getActor()).get_testament_as_testator(id);
        console.debug('start get testament as testator', result);
        if (result['Ok']) {
            return this.mapTestamentResponseToUiTestamentResponse(result['Ok'], UiTestamentListEntryRole.Testator);
        }
        throw mapError(result['Err']);
    }

    public async getTestamentAsHeir(id: string): Promise<UiTestamentResponse> {
        const result: Result_8 = await (await this.getActor()).get_testament_as_heir(id);
        if (result['Ok']) {
            return this.mapTestamentResponseToUiTestamentResponse(result['Ok'], UiTestamentListEntryRole.Heir);
        }
        throw mapError(result['Err']);
    }

    public async deleteTestament(id: string): Promise<void> {
        const result: Result_3 = await (await this.getActor()).remove_testament(id);
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    public async addHeir(heir: UiUser): Promise<UiUser> {
        console.debug('start adding heir: ', heir);

        // Check if it's a valid principal
        try {
            Principal.fromText(heir.id);
        } catch (e) {
            throw mapError(new Error('PrincipalCreationFailed'));
        }

        const user = this.mapUiUserToUser(heir);
        let addUserArgs: AddUserArgs = {
            email: user.email,
            id: user.id,
            name: user.name,
            user_type: user.user_type,
        }

        const result: Result = await (await this.getActor()).add_heir(addUserArgs);
        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async getHeirsList(): Promise<UiUser[]> {
        const result: Result_5 = await (await this.getActor()).get_heir_list();
        if (result['Ok']) {
            return result['Ok'].map((item) => this.mapUserToUiUser(item)) ;
        }
        throw mapError(result['Err']);
    }

    public async updateHeir(heir: UiUser): Promise<UiUser> {
        const user = this.mapUiUserToUser(heir);
        const result: Result = await (await this.getActor()).update_heir(user);

        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async deleteHeir(id: string) {
        const result: Result_3 = await (await this.getActor()).remove_heir(Principal.fromText(id));
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    private mapUserToUiUser(user: User): UiUser {
        let uiUser: UiUser =  {
            id: user.id.toText(),
            name: user.name.length > 0 ? user.name[0] : undefined,
            email: user.email.length > 0 ? user.email[0] : undefined,
            userVaultId: user.user_vault_id.length > 0 ? user.user_vault_id[0] : undefined,
            dateLastLogin: user.date_last_login.length > 0 ? this.nanosecondsInBigintToIsoString(user.date_last_login[0]) : undefined,
            dateCreated: this.nanosecondsInBigintToIsoString(user.date_created),
            dateModified: this.nanosecondsInBigintToIsoString(user.date_modified),
        }

        if (user.user_type.length === 0) {
            uiUser.type = undefined;
        } else if (user.user_type[0].hasOwnProperty('Person')) {
            uiUser.type = UiUserType.Person;
        } else if (user.user_type[0].hasOwnProperty('Company')) {
            uiUser.type = UiUserType.Company;
        } else {
            uiUser.type = undefined;
        }

        return uiUser;
    }

    private mapUiUserToUser(uiUser: UiUser): User {
        return {
            id: Principal.fromText(uiUser.id),
            user_type: uiUser.type ? [this.mapUiUserTypeToUserType(uiUser.type)] : [],
            date_created: uiUser.dateCreated ? this.dateToNanosecondsInBigint(uiUser.dateCreated) : 0n,
            name: uiUser.name ? [uiUser.name] : [],
            date_last_login: uiUser.dateLastLogin? [this.dateToNanosecondsInBigint(uiUser.dateLastLogin)] : [],
            email: uiUser.email ? [uiUser.email] : [],
            user_vault_id: uiUser.userVaultId ? [uiUser.userVaultId] : [],
            date_modified: uiUser.dateCreated ? this.dateToNanosecondsInBigint(uiUser.dateModified) : 0n,
        };
    }

    private async mapEncryptedSecretToUiSecret(secret: Secret, keyMaterial: SecretSymmetricCryptoMaterial, vetKey: Uint8Array): Promise<UiSecret> {

        // Decrypt symmetric key
        const decryptedSymmetricKey = await aes_gcm_decrypt(keyMaterial.encrypted_symmetric_key as Uint8Array, vetKey, keyMaterial.iv as Uint8Array);

        // Decrypt attributes
        let decryptedUsername = undefined;
        if (secret.username.length > 0) {
            decryptedUsername = await aes_gcm_decrypt(secret.username[0] as Uint8Array, decryptedSymmetricKey, keyMaterial.username_decryption_nonce[0] as Uint8Array);
        }
        let decryptedPassword = undefined;
        if (secret.password.length > 0) {
            decryptedPassword = await aes_gcm_decrypt(secret.password[0] as Uint8Array, decryptedSymmetricKey, keyMaterial.password_decryption_nonce[0] as Uint8Array);
        }

        let decryptedNotes = undefined;
        if (secret.notes.length > 0) {
            decryptedNotes = await aes_gcm_decrypt(secret.notes[0] as Uint8Array, decryptedSymmetricKey, keyMaterial.notes_decryption_nonce[0] as Uint8Array);
        }

        return this.mapSecretToUiSecret(secret, new TextDecoder().decode(decryptedUsername), new TextDecoder().decode(decryptedPassword), new TextDecoder().decode(decryptedNotes));
    }

    private async mapSecretToUiSecret(secret: Secret, username: string, password: string, notes: string): Promise<UiSecret> {

       let uiSecret: UiSecret = {
            id: secret.id,
            name: secret.name.length > 0 ? secret.name[0] : undefined,
            url: secret.url.length > 0 ? secret.url[0]: undefined,
            username: username,
            password: password,
            notes: notes,
            dateCreated: this.nanosecondsInBigintToIsoString(secret.date_modified),
            dateModified: this.nanosecondsInBigintToIsoString(secret.date_created),
        };

        if (secret.category.length === 0) {
            uiSecret.category = undefined;
        } else if (secret.category[0].hasOwnProperty(UiSecretCategory.Password)) {
            uiSecret.category = UiSecretCategory.Password;
        } else if (secret.category[0].hasOwnProperty(UiSecretCategory.Document)) {
            uiSecret.category = UiSecretCategory.Document;
        } else if (secret.category[0].hasOwnProperty(UiSecretCategory.Note)) {
            uiSecret.category = UiSecretCategory.Note;
        } else {
            uiSecret.category = undefined;
        }

        return uiSecret;
    }

    private nanosecondsInBigintToIsoString(nanoseconds: BigInt): string {
        const number = Number(nanoseconds);
        const milliseconds = Number(number / 1000000);
        return new Date(milliseconds).toISOString();
    }

    private dateToNanosecondsInBigint(isoDate: string): bigint {
        return BigInt(new Date(isoDate).getTime()) * 1000000n;
    }

    private async encryptNewSecret(uiSecret: UiSecret): Promise<AddSecretArgs> {
        // When creating new secrets no encryption key and no ivs are provided, they are generated new
        try {
            // Encrypt the symmetric key
            const symmetricKey = await get_local_random_aes_256_gcm_key();
            const ivSymmetricKey = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
            const uservaultVetKey = await get_aes_256_gcm_key_for_uservault(await this.getUserPrincipal(), (await this.getActor()));
            const encryptedSymmetricKey = await aes_gcm_encrypt(symmetricKey, uservaultVetKey, ivSymmetricKey);

            // Encrypt optional secret attributes
            let encryptedUsername = new Uint8Array(0);
            const ivUsername = window.crypto.getRandomValues(new Uint8Array(12)); // Always create an iv because if the username is added later as an update operation we need the key material
            if (uiSecret.username) {
                encryptedUsername = await aes_gcm_encrypt(uiSecret.username, symmetricKey, ivUsername);
            }

            let encryptedPassword = new Uint8Array(0);
            const ivPassword = window.crypto.getRandomValues(new Uint8Array(12)); // Always create an iv because if the password is added later as an update operation we need the key material
            if (uiSecret.password) {
                encryptedPassword = await aes_gcm_encrypt(uiSecret.password, symmetricKey, ivPassword);
            }

            let encryptedNotes = new Uint8Array(0);
            const ivNotes = window.crypto.getRandomValues(new Uint8Array(12)); // Always create an iv because if the note is added later as an update operation we need the key material
            if (uiSecret.notes) {
                encryptedNotes = await aes_gcm_encrypt(uiSecret.notes, symmetricKey, ivNotes);
            }

            let symmetricCryptoMaterial: SecretSymmetricCryptoMaterial = {
                encrypted_symmetric_key: encryptedSymmetricKey,
                iv: ivSymmetricKey,
                username_decryption_nonce: [ivUsername],
                password_decryption_nonce: [ivPassword],
                notes_decryption_nonce: [ivNotes],
            };

            return {
                id: uuidv4(),
                url: uiSecret.url ? [uiSecret.url] : [],
                name: [uiSecret.name],
                category: [this.mapUiSecretCategoryToSecretCategory(uiSecret.category)],
                username: encryptedUsername.length > 0 ? [encryptedUsername] : [],
                password: encryptedPassword.length > 0 ? [encryptedPassword] : [],
                notes: encryptedNotes.length > 0 ? [encryptedNotes] : [],
                symmetric_crypto_material: symmetricCryptoMaterial
            }
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
            return {
                id: uiSecret.id,
                url: uiSecret.url ? [uiSecret.url] : [],
                name: [uiSecret.name],
                category: [this.mapUiSecretCategoryToSecretCategory(uiSecret.category)],
                username: encryptedUsername.length > 0 ? [encryptedUsername] : [],
                password: encryptedPassword.length > 0 ? [encryptedPassword] : [],
                notes: encryptedNotes.length > 0 ? [encryptedNotes] : [],
                date_created: 0n, // will be ignored by update_secret function in backend
                date_modified: 0n // will be ignored by update_secret function in backend
            }
        } catch (e) {
            throw mapError(e)
        }
    }

    private mapUiSecretCategoryToSecretCategory(uiCategory: UiSecretCategory): SecretCategory {
        switch (uiCategory) {
            case UiSecretCategory.Password:
                return {'Password': null}
            case UiSecretCategory.Note:
                return {'Note': null}
            case UiSecretCategory.Document:
                return {'Document': null}
        }
    }

    private mapSecretCategoryToUiSecretCategory(category: SecretCategory) :UiSecretCategory {
        if (category.hasOwnProperty('Password')) {
            return UiSecretCategory.Password;
        } else if (category.hasOwnProperty('Note')) {
            return  UiSecretCategory.Note;
        } else if (category.hasOwnProperty('Document')) {
            return  UiSecretCategory.Document;
        }
    }

    private async mapUiTestamentToTestament(uiTestament: UiTestament): Promise<Testament> {
        const heirs = uiTestament.heirs.map((item) => {
            return Principal.fromText(item.id);
        });

        // Get the uservault vetKey to decrypt the symmetric encryption key
        const uservaultVetKey: Uint8Array = await get_aes_256_gcm_key_for_uservault(await this.getUserPrincipal(), (await this.getActor()));

        // Get vetkey for testaments
        const testamentVetKey = await get_aes_256_gcm_key_for_testament(uiTestament.id, (await this.getActor()));

        // Create key_box by encrypting symmetric secrets key with testament vetKey
        let keyBox = new Array<[string, SecretSymmetricCryptoMaterial]>;
        for (const item of uiTestament.secrets) {
            const result: Result_7 = await (await this.getActor()).get_secret_symmetric_crypto_material(item);
            if (result['Ok']) {
                // Decrypt symmetric key with uservault vetKey
                const decryptedSymmetricKey = await aes_gcm_decrypt(result['Ok'].encrypted_symmetric_key as Uint8Array, uservaultVetKey, result['Ok'].iv as Uint8Array);

                // Enrcypt symmetric key with testament vetKey
                const ivSymmetricKey = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                const encryptedSymmetricKey = await aes_gcm_encrypt(decryptedSymmetricKey, testamentVetKey, ivSymmetricKey);

                keyBox.push([item, {
                    iv: ivSymmetricKey,
                    encrypted_symmetric_key: encryptedSymmetricKey,
                    username_decryption_nonce: result['Ok'].username_decryption_nonce,
                    password_decryption_nonce: result['Ok'].password_decryption_nonce,
                    notes_decryption_nonce: result['Ok'].notes_decryption_nonce,
                }]);
            } else throw mapError(result['Err']);
        }

        return {
            id: uiTestament.id,
            heirs: heirs,
            name: [uiTestament.name],
            testator: Principal.fromText(uiTestament.testator.id),
            secrets: uiTestament.secrets,
            key_box: keyBox,
            condition_arg: BigInt(uiTestament.conditionArg),
            condition_status: uiTestament.conditionStatus,
            date_created: uiTestament.dateCreated ? this.dateToNanosecondsInBigint(uiTestament.dateCreated) : 0n,
            date_modified: uiTestament.dateModified ? this.dateToNanosecondsInBigint(uiTestament.dateModified) : 0n,
        }
    }

    private mapTestamentToUiTestament(testament: Testament, role: UiTestamentListEntryRole): UiTestament {
        return {
            id: testament.id,
            name: testament.name.length > 0 ? testament.name[0] : undefined,
            testator: { id: testament.testator.toString() },
            secrets: testament.secrets,
            heirs: testament.heirs.map((item) => {return {id: item.toString()}}),
            conditionArg: Number(testament.condition_arg),
            conditionStatus: testament.condition_status,
            dateCreated: this.nanosecondsInBigintToIsoString(testament.date_created),
            dateModified: this.nanosecondsInBigintToIsoString(testament.date_modified),
            role
        };
    }

    private mapTestamentResponseToUiTestamentResponse(testament: TestamentResponse, role: UiTestamentListEntryRole): UiTestamentResponse {
        let secrets: UiSecretListEntry[] = testament.secrets.map((item) => {
            let category = undefined;
            if (item.category.length > 0) {
                if (item.category[0].hasOwnProperty('Password')) {
                    category = UiSecretCategory.Password;
                } else if (item.category[0].hasOwnProperty('Note')) {
                    category = UiSecretCategory.Note;
                } if (item.category[0].hasOwnProperty('Document')) {
                    category = UiSecretCategory.Document;
                }
            }
            return {
                id: item.id,
                name: item.name.length > 0 ? item.name[0] : undefined,
                category: category,
            }
        })
        return {
            id: testament.id,
            name: testament.name.length > 0 ? testament.name[0] : undefined,
            testator: { id: testament.testator.toString() },
            secrets: secrets,
            heirs: testament.heirs.map((item) => {return {id: item.toString()}}),
            conditionArg: Number(testament.condition_arg),
            conditionStatus: testament.condition_status,
            dateCreated: this.nanosecondsInBigintToIsoString(testament.date_created),
            dateModified: this.nanosecondsInBigintToIsoString(testament.date_modified),
            role
        };
    }

    private mapUiUserTypeToUserType(uiUserType: UiUserType): UserType {
        switch (uiUserType) {
            case UiUserType.Person:
                return {'Person': null}
            case UiUserType.Company:
                return {'Company': null}
        }
    }
}

export default IcCryptService;
