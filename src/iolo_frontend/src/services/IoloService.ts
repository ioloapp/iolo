import {ActorSubclass, HttpAgent, Identity} from "@dfinity/agent";
import {
    _SERVICE,
    AddOrUpdateUserArgs,
    CreateContactArgs,
    CreatePolicyArgs,
    CreateSecretArgs,
    Policy,
    PolicyListEntry,
    Result,
    Result_1,
    Result_10,
    Result_11,
    Result_12,
    Result_2,
    Result_3,
    Result_4,
    Result_6,
    Result_7,
    Result_8,
    Result_9,
    Secret,
    SecretListEntry,
    UpdatePolicyArgs,
    UpdateSecretArgs
} from "../../../declarations/iolo_backend/iolo_backend.did";
import {AuthClient} from "@dfinity/auth-client";
import {createActor} from "../../../declarations/iolo_backend";
import {mapError} from "../utils/errorMapper";
import {IoloError} from "../error/Errors";
import {Principal} from "@dfinity/principal";
import {
    aes_gcm_decrypt,
    aes_gcm_encrypt,
    get_aes_256_gcm_key_for_policy,
    get_aes_256_gcm_key_for_user,
    get_local_random_aes_256_gcm_key
} from "../utils/crypto";
import {
    UiPolicy,
    UiPolicyListEntry,
    UiPolicyListEntryRole,
    UiPolicyWithSecretListEntries,
    UiSecret,
    UiSecretListEntry,
    UiUser,
    UiUserType
} from "./IoloTypesForUi";
import {RootState} from "../redux/store";
import IoloServiceMapper from "./IoloServiceMapper";

class IoloService {
    static instance: IoloService;
    private authClient: AuthClient;
    private identity: Identity;
    private agent: HttpAgent
    private actor: ActorSubclass<_SERVICE>;
    private ivLength = 12;
    private ioloServiceMapper: IoloServiceMapper;

    constructor() {
        if (IoloService.instance) {
            return IoloService.instance;
        }
        IoloService.instance = this;
        this.ioloServiceMapper = new IoloServiceMapper();
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

    private async getActor() {
        if (this.actor) {
            return this.actor;
        }
        try {
            await this.initClient();
            return this.actor;
        } catch (e) {
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
            user_type: uiUser.type ? (uiUser.type === UiUserType.Person ? [{'Person': null}] : [{'Company': null}]) : []
        }
        const result: Result_4 = await (await this.getActor()).create_user(args);
        if (result['Ok']) {
            return this.ioloServiceMapper.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async getCurrentUser(principal?: Principal): Promise<UiUser> {
        const result: Result_4 = await (await this.getActor()).get_current_user();
        if (result['Ok']) {
            return this.ioloServiceMapper.mapUserToUiUser(result['Ok']);
        }
        if (result['Err'].hasOwnProperty('UserDoesNotExist') && principal) {
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
            user_type: uiUser.type ? (uiUser.type === UiUserType.Person ? [{'Person': null}] : [{'Company': null}]) : []
        }
        let result: Result_4 = await (await this.getActor()).update_user(addOrUpdateUserArgs);
        if (result['Ok']) {
            return this.ioloServiceMapper.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async updateUserLoginDate(): Promise<UiUser> {
        let result: Result_4 = await (await this.getActor()).update_user_login_date();
        if (result['Ok']) {
            return this.ioloServiceMapper.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async getSecretList(): Promise<UiSecretListEntry[]> {
        const result: Result_12 = await (await this.getActor()).get_secret_list();
        if (result['Ok']) {
            return result['Ok'].map((secretListEntry: SecretListEntry): UiSecretListEntry => {
                return {
                    id: secretListEntry.id,
                    name: secretListEntry.name.length > 0 ? secretListEntry.name[0] : undefined,
                    category: secretListEntry.category.length > 0 ? this.ioloServiceMapper.mapSecretCategoryToUiSecretCategory(secretListEntry.category[0]) : undefined,
                };
            });
        }
        throw mapError(result['Err']);
    }

    public async getSecret(secretId: string): Promise<UiSecret> {
        console.debug('start getting secret...')
        const result1: Result_3 = await (await this.getActor()).get_secret(secretId);
        const result2: Result_7 = await (await this.getActor()).get_encrypted_symmetric_key(secretId);

        // Wait for both promises to complete
        const [value1, value2] = await Promise.all([result1, result2]);

        // Now you can use value1 and value2
        if (value1['Ok'] && value2['Ok']) {
            // Get the vetKey to decrypt the encryption key
            const userVetKey: Uint8Array = await get_aes_256_gcm_key_for_user(await this.getUserPrincipal(), (await this.getActor()));

            return this.mapEncryptedSecretToUiSecret(value1['Ok'], value2['Ok'], userVetKey);
        } else throw mapError(value1['Err']);
    }

    public async getSecretAsBeneficiary(secretId: string, policyId: string): Promise<UiSecret> {
        console.debug('start getting secret for beneficiary...')
        const result1: Result_3 = await (await this.getActor()).get_secret_as_beneficiary(secretId, policyId);
        const result2: Result_7 = await (await this.getActor()).get_encrypted_symmetric_key_as_beneficiary(secretId, policyId);

        // Wait for both promises to complete
        const [value1, value2] = await Promise.all([result1, result2]);

        // Now you can use value1 and value2
        if (value1['Ok'] && value2['Ok']) {
            // Get the vetKey to decrypt the encryption key
            const policyVetKey: Uint8Array = await get_aes_256_gcm_key_for_policy(policyId, (await this.getActor()));
            return this.mapEncryptedSecretToUiSecret(value1['Ok'], value2['Ok'], policyVetKey);
        } else throw mapError(value1['Err']);
    }

    public async createSecret(uiSecret: UiSecret): Promise<UiSecret> {
        console.debug('start creating secret...')
        const encryptedSecret: CreateSecretArgs = await this.encryptNewSecret(uiSecret)
        const result: Result_3 = await (await this.getActor()).create_secret(encryptedSecret);
        if (result['Ok']) {
            return this.ioloServiceMapper.mapSecretToUiSecret(result['Ok'], uiSecret.username, uiSecret.password, uiSecret.notes);
        }
        throw mapError(result['Err']);
    }

    public async updateSecret(uiSecret: UiSecret): Promise<UiSecret> {
        console.debug('start updating secret...')
        const resultEncryptedSymmetricKey: Result_7 = await (await this.getActor()).get_encrypted_symmetric_key(uiSecret.id);

        let encrypted_symmetric_key: Uint8Array;
        if (resultEncryptedSymmetricKey['Ok']) {
            encrypted_symmetric_key = resultEncryptedSymmetricKey['Ok'];
        } else {
            throw mapError(resultEncryptedSymmetricKey['Err']);
        }

        // Get secret with encrypted attributes incl. ivs
        const resultSecret: Result_3 = await (await this.getActor()).get_secret(uiSecret.id);
        let existingSecret: Secret;
        if (resultSecret['Ok']) {
            existingSecret = resultSecret['Ok'];
        } else {
            throw mapError(resultSecret['Err']);
        }

        // Get the vetKey to decrypt the encryption key
        const userVetKey: Uint8Array = await get_aes_256_gcm_key_for_user(await this.getUserPrincipal(), (await this.getActor()));

        // Decrypt symmetric key
        const decryptedSymmetricKey = await aes_gcm_decrypt(encrypted_symmetric_key as Uint8Array, userVetKey, this.ivLength);

        // Encrypt updated secret args
        const encryptedUpdateSecretArgs: UpdateSecretArgs = await this.encryptExistingSecret(uiSecret, decryptedSymmetricKey, existingSecret);

        // Update encrypted secret
        const resultUpdate: Result_3 = await (await this.getActor()).update_secret(encryptedUpdateSecretArgs);

        if (resultUpdate['Ok']) {
            return this.ioloServiceMapper.mapSecretToUiSecret(resultUpdate['Ok'], uiSecret.username, uiSecret.password, uiSecret.notes);
        }
        throw mapError(resultUpdate['Err']);
    }

    public async deleteSecret(secretId: string): Promise<void> {
        const result: Result_3 = await (await this.getActor()).delete_secret(secretId);
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    public async createPolicy(state: RootState, uiPolicy: UiPolicy): Promise<UiPolicy> {
        console.debug('start creating policy...');
        const createPolicyArgs: CreatePolicyArgs = {
            name: [uiPolicy.name],
        }

        // Create policy to get an id
        const result: Result_2 = await (await this.getActor()).create_policy(createPolicyArgs);
        if (result['Ok']) {
            uiPolicy.id = result['Ok'].id; // Use created policy id
            const policyForCreate = this.ioloServiceMapper.preparePolicyForCreate(uiPolicy);
            return await this.updatePolicy(state, policyForCreate); // Update created policy with all other attributes
        } else throw mapError(result['Err']);
    }

    public async updatePolicy(state: RootState, uiPolicy: UiPolicy): Promise<UiPolicy> {
        console.debug('start updating policy...')
        const updatePolicyArgs: UpdatePolicyArgs = await this.mapUiPolicyToUpdatePolicyArgs(uiPolicy);

        // Update policy
        const result: Result_2 = await (await this.getActor()).update_policy(updatePolicyArgs);
        if (result['Ok']) {
            return this.ioloServiceMapper.mapPolicyToUiPolicy(state, result['Ok'], UiPolicyListEntryRole.Owner);
        } else throw mapError(result['Err']);
    }

    public async getPolicyListOfUser(state: RootState): Promise<UiPolicyListEntry[]> {
        const resultAsOwner: Result_10 = await (await this.getActor()).get_policy_list_as_owner();
        let policiesAsOwner: UiPolicyListEntry[] = [];
        if (resultAsOwner['Ok']) {
            policiesAsOwner = resultAsOwner['Ok'].map((item: PolicyListEntry): UiPolicyListEntry => {
                return {
                    id: item.id,
                    name: item.name?.length > 0 ? item.name[0] : undefined,
                    owner: this.ioloServiceMapper.getUiUserFromId(state, item.owner),
                    role: UiPolicyListEntryRole.Owner,
                    conditionsStatus: item.conditions_status,
                }
            });
        } else {
            throw mapError(resultAsOwner['Err']);
        }
        return policiesAsOwner;
    }

    public async getPolicyListWhereUserIsBeneficiary(state: RootState): Promise<UiPolicyListEntry[]> {
        const resultAsBeneficiary: Result_10 = await (await this.getActor()).get_policy_list_as_beneficiary();
        let policiesAsBeneficiary: UiPolicyListEntry[] = [];
        if (resultAsBeneficiary['Ok'] && resultAsBeneficiary['Ok'].length > 0) {
            policiesAsBeneficiary = resultAsBeneficiary['Ok'].map((item: PolicyListEntry): UiPolicyListEntry => {
                return {
                    id: item.id,
                    name: item.name?.length > 0 ? item.name[0] : undefined,
                    owner: this.ioloServiceMapper.getUiUserFromId(state, item.owner),
                    role: UiPolicyListEntryRole.Beneficiary,
                    conditionsStatus: item.conditions_status,
                }
            });
        } else if (resultAsBeneficiary['Err']) {
            throw mapError(resultAsBeneficiary['Err']);
        }
        return policiesAsBeneficiary;
    }

    public async getPolicyListWhereUserIsValidator(state: RootState): Promise<UiPolicyListEntry[]> {
        const resultAsValidator: Result_11 = await (await this.getActor()).get_policy_list_as_validator();
        let policiesAsValidator: UiPolicy[] = [];
        if (resultAsValidator['Ok'] && resultAsValidator['Ok'].length > 0) {
            policiesAsValidator = resultAsValidator['Ok'].map((item: Policy): UiPolicy => {
                return {
                    id: item.id,
                    name: item.name?.length > 0 ? item.name[0] : undefined,
                    owner: this.ioloServiceMapper.getUiUserFromId(state, item.owner),
                    role: UiPolicyListEntryRole.Validator,
                    conditionsStatus: item.conditions_status,
                    conditions: item.conditions ? item.conditions.map(condition => this.ioloServiceMapper.mapConditionToUiCondition(state, condition)) : []
                }
            });
        } else if (resultAsValidator['Err']) {
            throw mapError(resultAsValidator['Err']);
        }
        return policiesAsValidator;
    }

    public async getPolicyAsOwner(state: RootState, id: string): Promise<UiPolicyWithSecretListEntries> {
        const result: Result_8 = await (await this.getActor()).get_policy_as_owner(id);
        console.debug('start get policies as owner', result);
        if (result['Ok']) {
            return this.ioloServiceMapper.mapPolicyWithSecretListEntriesToUiPolicyWithSecretListEntries(state, result['Ok'], UiPolicyListEntryRole.Owner);
        }
        throw mapError(result['Err']);
    }

    public async getPolicyAsBeneficiary(state: RootState, id: string): Promise<UiPolicyWithSecretListEntries> {
        const result: Result_8 = await (await this.getActor()).get_policy_as_beneficiary(id);
        if (result['Ok']) {
            return this.ioloServiceMapper.mapPolicyWithSecretListEntriesToUiPolicyWithSecretListEntries(state, result['Ok'], UiPolicyListEntryRole.Beneficiary);
        }
        throw mapError(result['Err']);
    }

    public async getPolicyAsValidator(state: RootState, id: string): Promise<UiPolicyWithSecretListEntries> {
        const result: Result_9 = await (await this.getActor()).get_policy_as_validator(id);
        if (result['Ok']) {
            return this.ioloServiceMapper.mapPolicyWithSecretListEntriesToUiPolicyWithSecretListEntries(state, result['Ok'], UiPolicyListEntryRole.Beneficiary);
        }
        throw mapError(result['Err']);
    }

    public async deletePolicy(id: string): Promise<void> {
        const result: Result_3 = await (await this.getActor()).delete_policy(id);
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
    }

    public async confirmXOutOfYCondition(policyValidatorList: UiPolicy[], policyId: string, conditionId: string, status: boolean): Promise<UiPolicy[]> {
        const result: Result_3 = await (await this.getActor()).confirm_x_out_of_y_condition({
            status,
            policy_id: policyId,
            condition_id: conditionId
        });
        if (result['Ok'] === null) {
            return this.ioloServiceMapper.mapValidationStausToPolicy(policyValidatorList, policyId, conditionId, status);
        }
        throw mapError(result['Err']);
    }

    public async createContact(contact: UiUser): Promise<UiUser> {
        console.debug('start creating contact: ', contact);

        // Check if it's a valid principal
        try {
            Principal.fromText(contact.id);
        } catch (e) {
            throw mapError(new Error('PrincipalCreationFailed'));
        }

        let createContactArgs: CreateContactArgs = {
            email: contact.email ? [contact.email] : [],
            id: contact.id,
            name: contact.name ? [contact.name] : [],
            user_type: contact.type ? [this.ioloServiceMapper.mapUiUserTypeToUserType(contact.type)] : [],
        }

        const result: Result_1 = await (await this.getActor()).create_contact(createContactArgs);
        if (result['Err']) {
            throw mapError(result['Err']);
        }
        return contact;
    }

    public async getContactsList(): Promise<UiUser[]> {
        const result: Result_6 = await (await this.getActor()).get_contact_list();
        if (result['Ok']) {
            return result['Ok'].map((item) => this.ioloServiceMapper.mapUserToUiUser(item));
        }
        throw mapError(result['Err']);
    }

    public async updateContact(contact: UiUser): Promise<UiUser> {
        const user = this.ioloServiceMapper.mapUiUserToUser(contact);
        const result: Result_1 = await (await this.getActor()).update_contact(user);

        if (result['Ok']) {
            return this.ioloServiceMapper.mapUserToUiUser(result['Ok']);
        }
        throw mapError(result['Err']);
    }

    public async deleteContact(id: string) {
        const result: Result = await (await this.getActor()).delete_contact(id);
        if (result['Ok'] === null) {
            return;
        }
        throw mapError(result['Err']);
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

        return this.ioloServiceMapper.mapSecretToUiSecret(secret, new TextDecoder().decode(decryptedUsername), new TextDecoder().decode(decryptedPassword), new TextDecoder().decode(decryptedNotes));
    }

    private async encryptNewSecret(uiSecret: UiSecret): Promise<CreateSecretArgs> {
        // When creating new secrets no encryption key and no ivs are provided, they are generated new
        try {
            // Encrypt the symmetric key
            const symmetricKey = await get_local_random_aes_256_gcm_key();
            const ivSymmetricKey = window.crypto.getRandomValues(new Uint8Array(this.ivLength)); // 96-bits; unique per message
            const userVetKey = await get_aes_256_gcm_key_for_user(await this.getUserPrincipal(), (await this.getActor()));
            const encryptedSymmetricKey = await aes_gcm_encrypt(symmetricKey, userVetKey, ivSymmetricKey);

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
                category: [this.ioloServiceMapper.mapUiSecretCategoryToSecretCategory(uiSecret.category)],
                username: encryptedUsername.length > 0 ? [encryptedUsername] : [],
                password: encryptedPassword.length > 0 ? [encryptedPassword] : [],
                notes: encryptedNotes.length > 0 ? [encryptedNotes] : [],
                encrypted_symmetric_key: encryptedSymmetricKey
            }
        } catch (e) {
            throw mapError(e)
        }
    }

    private async encryptExistingSecret(uiSecret: UiSecret, symmetricKey: Uint8Array, existingSecret: Secret): Promise<UpdateSecretArgs> {
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
                category: [this.ioloServiceMapper.mapUiSecretCategoryToSecretCategory(uiSecret.category)],
                username: encryptedUsername.length > 0 ? [encryptedUsername] : [],
                password: encryptedPassword.length > 0 ? [encryptedPassword] : [],
                notes: encryptedNotes.length > 0 ? [encryptedNotes] : [],
            }
        } catch (e) {
            throw mapError(e)
        }
    }

    private async mapUiPolicyToUpdatePolicyArgs(uiPolicy: UiPolicy): Promise<UpdatePolicyArgs> {
        // Get the user vetKey to decrypt the symmetric encryption key
        const userVetKey: Uint8Array = await get_aes_256_gcm_key_for_user(await this.getUserPrincipal(), (await this.getActor()));

        // Get vetkey for policies
        const policyVetKey = await get_aes_256_gcm_key_for_policy(uiPolicy.id, (await this.getActor()));

        // Create key_box by encrypting symmetric secrets key with policy vetKey
        let keyBox = new Array<[string, Uint8Array]>;
        for (const item of uiPolicy.secrets) {
            const result: Result_7 = await (await this.getActor()).get_encrypted_symmetric_key(item);
            if (result['Ok']) {
                // Decrypt symmetric key with user vetKey
                const decryptedSymmetricKey = await aes_gcm_decrypt(result['Ok'] as Uint8Array, userVetKey, this.ivLength);

                // Encrypt symmetric key with policy vetKey
                const ivSymmetricKey = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
                const encryptedSymmetricKey = await aes_gcm_encrypt(decryptedSymmetricKey, policyVetKey, ivSymmetricKey);

                keyBox.push([item, encryptedSymmetricKey]);
            } else {
                throw mapError(result['Err'])
            }
        }

        return this.ioloServiceMapper.mapUiPolicyToUpdatePolicyArgs(uiPolicy, keyBox);
    }
}

export default IoloService;
