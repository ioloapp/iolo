import {ActorSubclass, HttpAgent, Identity} from "@dfinity/agent";
import {v4 as uuidv4} from 'uuid';
import {
    _SERVICE,
    AddPolicyArgs,
    AddSecretArgs,
    AddOrUpdateUserArgs,
    Condition,
    Policy,
    PolicyListEntry,
    PolicyResponse,
    Result, Result_10,
    Result_2,
    Result_3,
    Result_5,
    Result_6,
    Result_7,
    Result_8,
    Result_9,
    Secret,
    SecretCategory,
    SecretListEntry,
    TimeBasedCondition,
    UpdateSecretArgs,
    User,
    UserType,
    XOutOfYCondition,
    AddContactArgs
} from "../../../declarations/iolo_backend/iolo_backend.did";
import {AuthClient} from "@dfinity/auth-client";
import {createActor} from "../../../declarations/iolo_backend";
import {mapError} from "../utils/errorMapper";
import {IoloError, UserDoesNotExist} from "../error/Errors";
import {Principal} from "@dfinity/principal";
import {
    aes_gcm_decrypt,
    aes_gcm_encrypt,
    get_aes_256_gcm_key_for_policy,
    get_aes_256_gcm_key_for_uservault,
    get_local_random_aes_256_gcm_key
} from "../utils/crypto";
import {
    ConditionType,
    LogicalOperator,
    UiCondition,
    UiPolicy,
    UiPolicyListEntry,
    UiPolicyListEntryRole,
    UiPolicyResponse,
    UiSecret,
    UiSecretCategory,
    UiSecretListEntry,
    UiTimeBasedCondition,
    UiUser,
    UiUserType,
    UiXOutOfYCondition
} from "./IoloTypesForUi";

class IoloService {
    static instance: IoloService;
    private authClient: AuthClient;
    private identity: Identity;
    private agent: HttpAgent
    private actor: ActorSubclass<_SERVICE>;
    private ivLength = 12;

    constructor() {
        if (IoloService.instance) {
            return IoloService.instance;
        }
        IoloService.instance = this;
        void this.initClient();
    }

    private async initClient() {
        this.authClient = await AuthClient.create();
        this.identity = this.authClient.getIdentity();
        this.agent = new HttpAgent({identity: this.identity});
        this.actor = createActor(process.env.IOLO_BACKEND_CANISTER_ID, {
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
            throw new IoloError("User not logged in");
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
                    console.error('login failed');
                    reject(new IoloError('login failed'));  // Reject the promise
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

    public async createUser(uiUser: UiUser): Promise<UiUser> {
        let args: AddOrUpdateUserArgs = {
            email: uiUser.email ? [uiUser.email] : [],
            name: uiUser.name ? [uiUser.name] : [],
            user_type: uiUser.type ? (uiUser.type === UiUserType.Person ? [{ 'Person' : null }] : [{ 'Company' : null }]) : []
        }
        const result: Result_3 = await (await this.getActor()).create_user(args);
        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async getCurrentUser(principal?: Principal): Promise<UiUser> {
        const result: Result_3 = await (await this.getActor()).get_current_user();
        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        if(result['Err'].hasOwnProperty('UserDoesNotExist') && principal){
            //onboarding
            return {
                id: principal.toString()
            } as UiUser
        }
        throw mapError(result['Err']);
    }

    public async updateUser(uiUser: UiUser): Promise<UiUser> {
        const addOrUpdateUserArgs: AddOrUpdateUserArgs = {
            email: uiUser.email ? [uiUser.email] : [],
            name: uiUser.name ? [uiUser.name] : [],
            user_type: uiUser.type ? (uiUser.type === UiUserType.Person ? [{ 'Person' : null }] : [{ 'Company' : null }]) : []
        }
        let result: Result_3 = await (await this.getActor()).update_user(addOrUpdateUserArgs);
        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async updateUserLoginDate(): Promise<UiUser> {
        let result: Result_3 = await (await this.getActor()).update_user_login_date();
        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async getSecretList(): Promise<UiSecretListEntry[]> {
        const result: Result_9 = await (await this.getActor()).get_secret_list();
        if (result['Ok']) {
            return result['Ok'].map((secretListEntry: SecretListEntry): UiSecretListEntry => {
                return {
                    id: secretListEntry.id.toString(),
                    name: secretListEntry.name.length > 0 ? secretListEntry.name[0] : undefined,
                    category: secretListEntry.category.length > 0 ? this.mapSecretCategoryToUiSecretCategory(secretListEntry.category[0]) : undefined,
                };
            });
        }
        throw mapError(result['Err']);
    }

    public async getSecret(secretId: string): Promise<UiSecret> {
        console.debug('start getting secret...')
        const result1: Result_2 = await (await this.getActor()).get_secret(secretId);
        const result2: Result_6 = await (await this.getActor()).get_encrypted_symmetric_key(secretId);

        // Wait for both promises to complete
        const [value1, value2] = await Promise.all([result1, result2]);

        // Now you can use value1 and value2
        if (value1['Ok'] && value2['Ok']) {
            // Get the vetKey to decrypt the encryption key
            const uservaultVetKey: Uint8Array = await get_aes_256_gcm_key_for_uservault(await this.getUserPrincipal(), (await this.getActor()));

            return this.mapEncryptedSecretToUiSecret(value1['Ok'], value2['Ok'], uservaultVetKey);
        } else throw mapError(value1['Err']);
    }

    public async getSecretAsBeneficiary(secretId: string, policyId: string): Promise<UiSecret> {
        console.debug('start getting secret for beneficiary...')
        const result1: Result_2 = await (await this.getActor()).get_secret_as_beneficiary(secretId.toString(), policyId);
        const result2: Result_6 = await (await this.getActor()).get_encrypted_symmetric_key_as_beneficiary(secretId, policyId);

        // Wait for both promises to complete
        const [value1, value2] = await Promise.all([result1, result2]);

        // Now you can use value1 and value2
        if (value1['Ok'] && value2['Ok']) {
            // Get the vetKey to decrypt the encryption key
            const policyVetKey: Uint8Array = await get_aes_256_gcm_key_for_policy(policyId, (await this.getActor()));
            return this.mapEncryptedSecretToUiSecret(value1['Ok'], value2['Ok'], policyVetKey);
        } else throw mapError(value1['Err']);
    }

    public async addSecret(uiSecret: UiSecret): Promise<UiSecret> {
        console.debug('start adding secret...')
        const encryptedSecret: AddSecretArgs = await this.encryptNewSecret(uiSecret)
        const result: Result_2 = await (await this.getActor()).add_secret(encryptedSecret);
        if (result['Ok']) {
            return this.mapSecretToUiSecret(result['Ok'], uiSecret.username, uiSecret.password, uiSecret.notes);
        }
        throw mapError(result['Err']);
    }

    public async updateSecret(uiSecret: UiSecret): Promise<UiSecret> {
        console.debug('start updating secret...')
        const resultEncryptedSymmetricKey: Result_6 = await (await this.getActor()).get_encrypted_symmetric_key(uiSecret.id);

        let encrypted_symmetric_key: Uint8Array;
        if (resultEncryptedSymmetricKey['Ok']) {
            encrypted_symmetric_key = resultEncryptedSymmetricKey['Ok'];
        } else {
            throw mapError(resultEncryptedSymmetricKey['Err']);
        }

        // Get secret with encrypted attributes incl. ivs
        const resultSecret: Result_2 = await (await this.getActor()).get_secret(uiSecret.id);
        let existingSecret: Secret;
        if (resultSecret['Ok']) {
            existingSecret = resultSecret['Ok'];
        } else {
            throw mapError(resultSecret['Err']);
        }

        // Get the vetKey to decrypt the encryption key
        const uservaultVetKey: Uint8Array = await get_aes_256_gcm_key_for_uservault(await this.getUserPrincipal(),(await this.getActor()));

        // Decrypt symmetric key
        const decryptedSymmetricKey = await aes_gcm_decrypt(encrypted_symmetric_key as Uint8Array, uservaultVetKey, this.ivLength);

        // Encrypt updated secret args
        const encryptedUpdateSecretArgs: UpdateSecretArgs = await this.encryptExistingSecret(uiSecret, decryptedSymmetricKey, existingSecret);

        // Update encrypted secret
        const resultUpdate: Result_2 = await (await this.getActor()).update_secret(encryptedUpdateSecretArgs);

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

    public async addPolicy(uiPolicy: UiPolicy): Promise<UiPolicy> {
        console.debug('start adding policy...');
        const addPolicyArgs: AddPolicyArgs = {
            name: [uiPolicy.name],
        }

        // Add policy to get an id
        const result = await (await this.getActor()).add_policy(addPolicyArgs);
        if (result['Ok']) {
            uiPolicy.id = result['Ok'].id; // Use created policy id
            return await this.updatePolicy(uiPolicy); // Update created policy with all other attributes
        } else throw mapError(result['Err']);
    }

    public async updatePolicy(uiPolicy: UiPolicy): Promise<UiPolicy> {
        console.debug('start updating policy...')
        const policy: Policy = await this.mapUiPolicyToPolicy(uiPolicy);

        // Update policy
        const result = await (await this.getActor()).update_policy(policy);
        if (result['Ok']) {
            return this.mapPolicyToUiPolicy(result['Ok'], UiPolicyListEntryRole.Owner);
        } else throw mapError(result['Err']);
    }

    public async getPolicyList(): Promise<UiPolicyListEntry[]> {
        const resultAsTestator: Result_8 = await (await this.getActor()).get_policy_list_as_owner();
        let policiesAsTestator: UiPolicyListEntry[] = [];
        if (resultAsTestator['Ok']) {
            policiesAsTestator = resultAsTestator['Ok'].map((item: PolicyListEntry): UiPolicyListEntry  => {
                return {
                    id: item.id,
                    name: item.name?.length > 0 ? item.name[0] : undefined,
                    owner: { id: item.owner?.toString()},
                    role: UiPolicyListEntryRole.Owner,
                    conditionStatus: item.condition_status,
                }
            });
        } else {
            throw mapError(resultAsTestator['Err']);
        }

        const resultAsBeneficiary: Result_8 = await (await this.getActor()).get_policy_list_as_beneficiary();
        let policiesAsBeneficiary: UiPolicyListEntry[] =  [];
        if (resultAsBeneficiary['Ok'] && resultAsBeneficiary['Ok'].length > 0) {
            policiesAsBeneficiary = resultAsBeneficiary['Ok'].map((item: PolicyListEntry): UiPolicyListEntry  => {
                return {
                    id: item.id,
                    name: item.name?.length > 0 ? item.name[0] : undefined,
                    owner: { id: item.owner?.toString()},
                    role: UiPolicyListEntryRole.Beneficiary,
                    conditionStatus: item.condition_status,
                }
            });
        } else if (resultAsBeneficiary['Err']) {
            throw mapError(resultAsBeneficiary['Err']);
        }
        return policiesAsTestator.concat(policiesAsBeneficiary);
    }

    public async getPolicyAsOwner(id: string): Promise<UiPolicyResponse> {
        const result: Result_7 = await (await this.getActor()).get_policy_as_owner(id);
        console.debug('start get policies as owner', result);
        if (result['Ok']) {
            return this.mapPolicyResponseToUiPolicyResponse(result['Ok'], UiPolicyListEntryRole.Owner);
        }
        throw mapError(result['Err']);
    }

    public async getPolicyAsBeneficiary(id: string): Promise<UiPolicyResponse> {
        const result: Result_7 = await (await this.getActor()).get_policy_as_beneficiary(id);
        if (result['Ok']) {
            return this.mapPolicyResponseToUiPolicyResponse(result['Ok'], UiPolicyListEntryRole.Beneficiary);
        }
        throw mapError(result['Err']);
    }

    public async deletePolicy(id: string): Promise<void> {
        const result: Result_3 = await (await this.getActor()).remove_policy(id);
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    public async confirmXOutOfYCondition (testator: Principal, policyId: string, status: boolean): Promise<void> {
        const result: Result_3 = await (await this.getActor()).confirm_x_out_of_y_condition(testator.toString(), policyId, status);
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    public async addContact(contact: UiUser): Promise<UiUser> {
        console.debug('start adding contact: ', contact);

        // Check if it's a valid principal
        try {
            Principal.fromText(contact.id);
        } catch (e) {
            throw mapError(new Error('PrincipalCreationFailed'));
        }

        let addContactArgs: AddContactArgs = {
            email: contact.email ? [contact.email] : [],
            id: contact.id,
            name: contact.name ? [contact.name] : [],
            user_type: contact.type ? [this.mapUiUserTypeToUserType(contact.type)] : [],
        }

        const result: Result = await (await this.getActor()).add_contact(addContactArgs);
        if (result['Err']) {
            throw mapError(result['Err']);
        }
        return contact;
    }

    public async getContactsList(): Promise<UiUser[]> {
        const result: Result_5 = await (await this.getActor()).get_contact_list();
        if (result['Ok']) {
            return result['Ok'].map((item) => this.mapUserToUiUser(item)) ;
        }
        throw mapError(result['Err']);
    }

    public async updateContact(contact: UiUser): Promise<UiUser> {
        const user = this.mapUiUserToUser(contact);
        const result: Result_10 = await (await this.getActor()).update_contact(user);

        if (result['Ok']) {
            return this.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async deleteContact(id: string) {
        const result: Result = await (await this.getActor()).remove_contact(id);
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    private mapUserToUiUser(user: User): UiUser {
        let uiUser: UiUser =  {
            id: user.id,
            name: user.name.length > 0 ? user.name[0] : undefined,
            email: user.email.length > 0 ? user.email[0] : undefined,
            dateLastLogin: user.date_last_login?.length > 0 ? this.nanosecondsInBigintToIsoString(user.date_last_login[0]) : undefined,
            dateCreated: user.date_created ? this.nanosecondsInBigintToIsoString(user.date_created) : undefined,
            dateModified: user.date_modified ? this.nanosecondsInBigintToIsoString(user.date_modified) : undefined,
        }

        if (user.user_type === undefined || user.user_type.length === 0) {
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
            key_box: undefined,
            policies: undefined,
            secrets: undefined,
            id: uiUser.id,
            user_type: uiUser.type ? [this.mapUiUserTypeToUserType(uiUser.type)] : [],
            date_created: uiUser.dateCreated ? this.dateToNanosecondsInBigint(uiUser.dateCreated) : 0n,
            name: uiUser.name ? [uiUser.name] : [],
            date_last_login: uiUser.dateLastLogin? [this.dateToNanosecondsInBigint(uiUser.dateLastLogin)] : [],
            email: uiUser.email ? [uiUser.email] : [],
            date_modified: uiUser.dateCreated ? this.dateToNanosecondsInBigint(uiUser.dateModified) : 0n,
            contacts: [],
        };
    }

    private async mapEncryptedSecretToUiSecret(secret: Secret, encrypted_symmetric_key: Uint8Array, vetKey: Uint8Array): Promise<UiSecret> {

        // Decrypt symmetric key
        const decryptedSymmetricKey = await aes_gcm_decrypt(encrypted_symmetric_key, vetKey, this.ivLength);

        // Decrypt attributes
        let decryptedUsername = undefined;
        if (secret.username.length > 0) {
            decryptedUsername = await aes_gcm_decrypt(secret.username[0] as Uint8Array, decryptedSymmetricKey, this.ivLength);
        }
        let decryptedPassword = undefined;
        if (secret.password.length > 0) {
            decryptedPassword = await aes_gcm_decrypt(secret.password[0] as Uint8Array, decryptedSymmetricKey, this.ivLength);
        }

        let decryptedNotes = undefined;
        if (secret.notes.length > 0) {
            decryptedNotes = await aes_gcm_decrypt(secret.notes[0] as Uint8Array, decryptedSymmetricKey, this.ivLength);
        }

        return this.mapSecretToUiSecret(secret, new TextDecoder().decode(decryptedUsername), new TextDecoder().decode(decryptedPassword), new TextDecoder().decode(decryptedNotes));
    }

    private async mapSecretToUiSecret(secret: Secret, username: string, password: string, notes: string): Promise<UiSecret> {

       let uiSecret: UiSecret = {
            id: secret.id.toString(),
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
            //TODO reactivate
        // } else if (secret.category[0].hasOwnProperty(UiSecretCategory.Document)) {
        //     uiSecret.category = UiSecretCategory.Document;
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
            const ivSymmetricKey = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); // 96-bits; unique per message
            const uservaultVetKey = await get_aes_256_gcm_key_for_uservault(await this.getUserPrincipal(), (await this.getActor()));
            const encryptedSymmetricKey = await aes_gcm_encrypt(symmetricKey, uservaultVetKey, ivSymmetricKey);

            // Encrypt optional secret attributes
            let encryptedUsername = new Uint8Array(0);
            const ivUsername = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); // Always create an iv because if the username is added later as an update operation we need the key material
            if (uiSecret.username) {
                encryptedUsername = await aes_gcm_encrypt(uiSecret.username, symmetricKey, ivUsername);
            }

            let encryptedPassword = new Uint8Array(0);
            const ivPassword = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); // Always create an iv because if the password is added later as an update operation we need the key material
            if (uiSecret.password) {
                encryptedPassword = await aes_gcm_encrypt(uiSecret.password, symmetricKey, ivPassword);
            }

            let encryptedNotes = new Uint8Array(0);
            const ivNotes = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); // Always create an iv because if the note is added later as an update operation we need the key material
            if (uiSecret.notes) {
                encryptedNotes = await aes_gcm_encrypt(uiSecret.notes, symmetricKey, ivNotes);
            }

            return {
                url: uiSecret.url ? [uiSecret.url] : [],
                name: [uiSecret.name],
                category: [this.mapUiSecretCategoryToSecretCategory(uiSecret.category)],
                username: encryptedUsername.length > 0 ? [encryptedUsername] : [],
                password: encryptedPassword.length > 0 ? [encryptedPassword] : [],
                notes: encryptedNotes.length > 0 ? [encryptedNotes] : [],
                encrypted_symmetric_key: encryptedSymmetricKey
            }
        } catch (e) {
            throw mapError(e)
        }
    }

    private async encryptExistingSecret(uiSecret: UiSecret, symmetricKey:  Uint8Array, existingSecret: Secret): Promise<UpdateSecretArgs> {
        // When updating existing secrets the existing encryption key and the existing ivs must be used
        try {
            // Encrypt optional secret attributes
            let encryptedUsername = new Uint8Array(0);
            if (uiSecret.username) {
                // Check if username is already in existing secret
                let ivUsername: Uint8Array;
                if (existingSecret.username.length > 0) {
                    // Use existing iv
                    ivUsername = existingSecret.username[0].slice(0, this.ivLength) as Uint8Array;
                } else {
                    // Create new iv
                    ivUsername = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); // 96-bits; unique per message
                }
                encryptedUsername = await aes_gcm_encrypt(uiSecret.username, symmetricKey, ivUsername);
            }

            let encryptedPassword = new Uint8Array(0);
            if (uiSecret.password) {
                // Check if password is already in existing secret
                let ivPassword: Uint8Array;
                if (existingSecret.password.length > 0) {
                    // Use existing iv
                    ivPassword = existingSecret.password[0].slice(0, this.ivLength) as Uint8Array;
                } else {
                    // Create new iv
                    ivPassword = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); // 96-bits; unique per message
                }
                encryptedPassword = await aes_gcm_encrypt(uiSecret.password, symmetricKey, ivPassword);
            }

            let encryptedNotes = new Uint8Array(0);
            if (uiSecret.notes) {
                // Check if notes is already in existing secret
                let ivNotes: Uint8Array;
                if (existingSecret.notes.length > 0) {
                    // Use existing iv
                    ivNotes = existingSecret.notes[0].slice(0, this.ivLength) as Uint8Array;
                } else {
                    // Create new iv
                    ivNotes = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); // 96-bits; unique per message
                }
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
            //TODO reactivate
            // case UiSecretCategory.Document:
            //     return {'Document': null}
        }
    }

    private mapSecretCategoryToUiSecretCategory(category: SecretCategory) :UiSecretCategory {
        if (category.hasOwnProperty('Password')) {
            return UiSecretCategory.Password;
        } else if (category.hasOwnProperty('Note')) {
            return  UiSecretCategory.Note;
            //TODO reactivate
        // } else if (category.hasOwnProperty('Document')) {
        //     return  UiSecretCategory.Document;
        }
    }

    private async mapUiPolicyToPolicy(uiPolicy: UiPolicy): Promise<Policy> {
        const beneficiaries = uiPolicy.beneficiaries.map((item) => item.id);

        // Get the uservault vetKey to decrypt the symmetric encryption key
        const uservaultVetKey: Uint8Array = await get_aes_256_gcm_key_for_uservault(await this.getUserPrincipal(), (await this.getActor()));

        // Get vetkey for policies
        const policyVetKey = await get_aes_256_gcm_key_for_policy(uiPolicy.id, (await this.getActor()));

        // Create key_box by encrypting symmetric secrets key with policy vetKey
        let keyBox = new Array<[string, Uint8Array]>;
        for (const item of uiPolicy.secrets) {
            const result: Result_6 = await (await this.getActor()).get_encrypted_symmetric_key(item);
            if (result['Ok']) {
                // Decrypt symmetric key with uservault vetKey
                const decryptedSymmetricKey = await aes_gcm_decrypt(result['Ok'].encrypted_symmetric_key as Uint8Array, uservaultVetKey, this.ivLength);

                // Encrypt symmetric key with policy vetKey
                const ivSymmetricKey = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                const encryptedSymmetricKey = await aes_gcm_encrypt(decryptedSymmetricKey, policyVetKey, ivSymmetricKey);

                keyBox.push([item,  encryptedSymmetricKey]);
            } else throw mapError(result['Err']);
        }

        return {
            id: uiPolicy.id,
            beneficiaries: beneficiaries,
            name: [uiPolicy.name],
            owner: uiPolicy.owner.id,
            secrets: uiPolicy.secrets.map((item) => item.toString()),
            key_box: keyBox,
            conditions_logical_operator: uiPolicy.conditionsLogicalOperator == LogicalOperator.And ? [{ 'And' : null }] : [{ 'Or' : null }],
            conditions_status: uiPolicy.conditionsStatus,
            conditions: uiPolicy.conditions.map(uiCondition => this.mapUiConditionToCondition(uiCondition)),
            date_created: uiPolicy.dateCreated ? this.dateToNanosecondsInBigint(uiPolicy.dateCreated) : 0n,
            date_modified: uiPolicy.dateModified ? this.dateToNanosecondsInBigint(uiPolicy.dateModified) : 0n,
        }
    }

    private mapUiConditionToCondition(uiCondition: UiCondition): Condition {
        if(uiCondition.type === ConditionType.TimeBasedCondition){
            const tCondition = uiCondition as UiTimeBasedCondition;
            const timeBasedCondition = {
                id: tCondition.id,
                condition_status: tCondition.conditionStatus,
                number_of_days_since_last_login: tCondition.numberOfDaysSinceLastLogin ? BigInt(tCondition.numberOfDaysSinceLastLogin): BigInt(100)
            } as TimeBasedCondition
            return {
                TimeBasedCondition: timeBasedCondition
            }
        }
        if(uiCondition.type === ConditionType.XOutOfYCondition){
            const xCondition = uiCondition as UiXOutOfYCondition;
            const xOutOfYCondition: XOutOfYCondition = {
                id: xCondition.id,
                condition_status: xCondition.conditionStatus,
                quorum: xCondition.quorum ? BigInt(xCondition.quorum): BigInt(xCondition.validators.length),
                validators: xCondition.validators.map(v => {
                    return {
                        id: v.user.id,
                        status: v.status
                    }
                })
            }
            return {
                XOutOfYCondition: xOutOfYCondition
            }
        }
    }

    private mapPolicyToUiPolicy(policy: Policy, role: UiPolicyListEntryRole): UiPolicy {
        return {
            id: policy.id,
            name: policy.name.length > 0 ? policy.name[0] : undefined,
            owner: { id: policy.owner.toString() },
            secrets: policy.secrets,
            beneficiaries: policy.beneficiaries.map((item) => {return {id: item.toString()}}),
            conditionsLogicalOperator: policy.conditions_logical_operator.hasOwnProperty('And') ? LogicalOperator.And : LogicalOperator.Or,
            conditionsStatus: policy.conditions_status,
            conditions: policy.conditions.map(condition => this.mapConditionToUiCondition(condition)),
            dateCreated: this.nanosecondsInBigintToIsoString(policy.date_created),
            dateModified: this.nanosecondsInBigintToIsoString(policy.date_modified),
            role
        };
    }

    private mapConditionToUiCondition(condition: Condition): UiTimeBasedCondition | UiXOutOfYCondition{
        if(condition.hasOwnProperty(ConditionType.TimeBasedCondition)){
            const timeBasedCondition: TimeBasedCondition = condition[ConditionType.TimeBasedCondition];
            return  {
                id: timeBasedCondition.id,
                type: ConditionType.TimeBasedCondition,
                conditionStatus: timeBasedCondition.condition_status,
                numberOfDaysSinceLastLogin: Number(timeBasedCondition.number_of_days_since_last_login)
            } as UiTimeBasedCondition
        }
        if(condition.hasOwnProperty(ConditionType.XOutOfYCondition)){
            const xOutOfYCondition: XOutOfYCondition = condition[ConditionType.XOutOfYCondition];
            return  {
                id: xOutOfYCondition.id,
                type: ConditionType.XOutOfYCondition,
                conditionStatus: xOutOfYCondition.condition_status,
                quorum: Number(xOutOfYCondition.quorum),
                validators: xOutOfYCondition.validators.map(v => {
                    return {
                        status: v.status,
                        user: {
                            id: v.id.toString()
                        }
                    }
                })
            } as UiXOutOfYCondition
        }
    }

    private mapPolicyResponseToUiPolicyResponse(policy: PolicyResponse, role: UiPolicyListEntryRole): UiPolicyResponse {
        let secrets: UiSecretListEntry[] = policy.secrets.map((item) => {
            let category = undefined;
            if (item.category.length > 0) {
                if (item.category[0].hasOwnProperty('Password')) {
                    category = UiSecretCategory.Password;
                } else if (item.category[0].hasOwnProperty('Note')) {
                    category = UiSecretCategory.Note;
                    //TODO reactivate
                // } else if (item.category[0].hasOwnProperty('Document')) {
                //     category = UiSecretCategory.Document;
                }
            }
            return {
                id: item.id.toString(),
                name: item.name.length > 0 ? item.name[0] : undefined,
                category: category,
            }
        })
        return {
            id: policy.id,
            name: policy.name.length > 0 ? policy.name[0] : undefined,
            owner: { id: policy.owner.toString() },
            secrets: secrets,
            beneficiaries: policy.beneficiaries.map((item) => {return {id: item.toString()}}),
            conditionsLogicalOperator: policy.conditions_logical_operator.hasOwnProperty('And') ? LogicalOperator.And : LogicalOperator.Or,
            conditionsStatus: policy.conditions_status,
            conditions: policy.conditions.map(condition => this.mapConditionToUiCondition(condition)),
            dateCreated: this.nanosecondsInBigintToIsoString(policy.date_created),
            dateModified: this.nanosecondsInBigintToIsoString(policy.date_modified),
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

export default IoloService;
