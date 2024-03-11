import {
    Condition,
    FixedDateTimeCondition,
    LastLoginTimeCondition,
    LogicalOperator,
    Policy,
    PolicyWithSecretListEntries,
    Secret,
    SecretCategory,
    UpdateCondition,
    UpdateFixedDateTimeCondition,
    UpdateLastLoginTimeCondition,
    UpdatePolicyArgs,
    UpdateXOutOfYCondition,
    User,
    UserType,
    XOutOfYCondition
} from "../../../declarations/iolo_backend/iolo_backend.did";
import {
    ConditionType,
    LogicalOperator as UiLogicalOperator,
    UiCondition,
    UiFixedDateTimeCondition,
    UiLastLoginTimeCondition,
    UiPolicy,
    UiPolicyListEntryRole,
    UiPolicyWithSecretListEntries,
    UiSecret,
    UiSecretCategory,
    UiSecretListEntry,
    UiUser,
    UiUserType,
    UiXOutOfYCondition
} from "./IoloTypesForUi";
import {RootState} from "../redux/store";

class IoloServiceMapper {
    static instance: IoloServiceMapper;

    constructor() {
        if (IoloServiceMapper.instance) {
            return IoloServiceMapper.instance;
        }
        IoloServiceMapper.instance = this;
    }

    public mapUserToUiUser(user: User): UiUser {
        let uiUser: UiUser = {
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

    public mapUiUserToUser(uiUser: UiUser): User {
        return {
            key_box: undefined,
            policies: undefined,
            secrets: undefined,
            id: uiUser.id,
            user_type: uiUser.type ? [this.mapUiUserTypeToUserType(uiUser.type)] : [],
            date_created: uiUser.dateCreated ? this.dateToNanosecondsInBigint(uiUser.dateCreated) : 0n,
            name: uiUser.name ? [uiUser.name] : [],
            date_last_login: uiUser.dateLastLogin ? [this.dateToNanosecondsInBigint(uiUser.dateLastLogin)] : [],
            email: uiUser.email ? [uiUser.email] : [],
            date_modified: uiUser.dateCreated ? this.dateToNanosecondsInBigint(uiUser.dateModified) : 0n,
            contacts: [],
        };
    }

    public async mapSecretToUiSecret(secret: Secret, username: string, password: string, notes: string): Promise<UiSecret> {

        let uiSecret: UiSecret = {
            id: secret.id,
            name: secret.name.length > 0 ? secret.name[0] : undefined,
            url: secret.url.length > 0 ? secret.url[0] : undefined,
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

    public nanosecondsInBigintToIsoString(nanoseconds: BigInt): string {
        if(nanoseconds) {
            const number = Number(nanoseconds);
            const milliseconds = Number(number / 1000000);
            return new Date(milliseconds).toISOString();
        }
        return null;
    }

    public dateToNanosecondsInBigint(isoDate: string): bigint {
        if(isoDate) {
            return BigInt(new Date(isoDate).getTime()) * 1000000n;
        }
        return null;
    }

    public mapUiSecretCategoryToSecretCategory(uiCategory: UiSecretCategory): SecretCategory {
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

    public mapSecretCategoryToUiSecretCategory(category: SecretCategory): UiSecretCategory {
        if (category.hasOwnProperty('Password')) {
            return UiSecretCategory.Password;
        } else if (category.hasOwnProperty('Note')) {
            return UiSecretCategory.Note;
            //TODO reactivate
            // } else if (category.hasOwnProperty('Document')) {
            //     return  UiSecretCategory.Document;
        }
    }

    public async mapUiPolicyToUpdatePolicyArgs(uiPolicy: UiPolicy, keyBox): Promise<UpdatePolicyArgs> {
        const beneficiaries = uiPolicy.beneficiaries.map((item) => item.id);

        let logicalOperator: LogicalOperator[]  = [];
        if (uiPolicy.conditionsLogicalOperator === UiLogicalOperator.And) {
            logicalOperator = [{'And': null}];
        } else if (uiPolicy.conditionsLogicalOperator === UiLogicalOperator.Or) {
            logicalOperator = [{'Or': null}];
        }

        return {
            id: uiPolicy.id,
            beneficiaries: beneficiaries,
            name: [uiPolicy.name],
            secrets: uiPolicy.secrets,
            key_box: keyBox,
            conditions_logical_operator: uiPolicy.conditions.length > 1 && logicalOperator.length > 0 ? [logicalOperator[0]] : [],
            conditions: uiPolicy.conditions.map(uiCondition => this.mapUiConditionToUpdateCondition(uiCondition)),
        }
    }

    public mapUiConditionToUpdateCondition(uiCondition: UiCondition): UpdateCondition {
        if (uiCondition.type === ConditionType.LastLogin) {
            const tCondition = uiCondition as UiLastLoginTimeCondition;
            const updateLastLoginTimeCondition: UpdateLastLoginTimeCondition = {
                id: tCondition.id ? [tCondition.id] : [],
                number_of_days_since_last_login: tCondition.numberOfDaysSinceLastLogin ? BigInt(tCondition.numberOfDaysSinceLastLogin) : BigInt(100)
            } as UpdateLastLoginTimeCondition
            return {
                LastLogin: updateLastLoginTimeCondition
            }
        }
        if (uiCondition.type === ConditionType.FixedDateTime) {
            const tCondition = uiCondition as UiFixedDateTimeCondition;
            const datetimemiliseconds = tCondition.datetime ? tCondition.datetime.getTime() : new Date().getTime();
            const updateFutureTimeCondition: UpdateFixedDateTimeCondition = {
                id: tCondition.id ? [tCondition.id] : [],
                datetime: BigInt(datetimemiliseconds * 1000000)
            } as UpdateFixedDateTimeCondition
            return {
                FixedDateTime: updateFutureTimeCondition
            }
        }
        if (uiCondition.type === ConditionType.XOutOfY) {
            const tCondition = uiCondition as UiXOutOfYCondition;
            const updateXOutOfYCondition: UpdateXOutOfYCondition = {
                id: tCondition.id ? [tCondition.id] : [],
                question: tCondition.question,
                quorum: tCondition.quorum ? BigInt(tCondition.quorum) : BigInt(tCondition.validators.length),
                validators: tCondition.validators.map(v => {
                    return {
                        principal_id: v.user.id,
                        status: [] //do not init validation state with a value
                    }
                })
            } as UpdateXOutOfYCondition
            return {
                XOutOfY: updateXOutOfYCondition
            }
        }
    }

    public mapPolicyToUiPolicy(state: RootState, policy: Policy, role: UiPolicyListEntryRole): UiPolicy {
        return {
            id: policy.id,
            name: policy.name.length > 0 ? policy.name[0] : undefined,
            owner: this.getUiUserFromId(state, policy.owner),
            secrets: policy.secrets,
            beneficiaries: policy.beneficiaries.map((item) => {
                return this.getUiUserFromId(state, item)
            }),
            conditionsLogicalOperator: policy.conditions_logical_operator.hasOwnProperty('And') ? UiLogicalOperator.And : UiLogicalOperator.Or,
            conditionsStatus: policy.conditions_status,
            conditions: policy.conditions.map(condition => this.mapConditionToUiCondition(state, condition)),
            dateCreated: this.nanosecondsInBigintToIsoString(policy.date_created),
            dateModified: this.nanosecondsInBigintToIsoString(policy.date_modified),
            role
        };
    }

    public mapConditionToUiCondition(state: RootState, condition: Condition): UiLastLoginTimeCondition | UiXOutOfYCondition | UiFixedDateTimeCondition {
        if (condition.hasOwnProperty(ConditionType.LastLogin)) {
            const timeBasedCondition: LastLoginTimeCondition = condition[ConditionType.LastLogin];
            return {
                id: timeBasedCondition.id,
                type: ConditionType.LastLogin,
                conditionStatus: timeBasedCondition.condition_status,
                numberOfDaysSinceLastLogin: Number(timeBasedCondition.number_of_days_since_last_login)
            } as UiLastLoginTimeCondition
        }
        if (condition.hasOwnProperty(ConditionType.FixedDateTime)) {
            const fixedDateTimeCondition: FixedDateTimeCondition = condition[ConditionType.FixedDateTime];
            return {
                id: fixedDateTimeCondition.id,
                type: ConditionType.FixedDateTime,
                conditionStatus: fixedDateTimeCondition.condition_status,
                datetime: new Date(Number(fixedDateTimeCondition.datetime) / 1000000)
            } as UiFixedDateTimeCondition
        }
        if (condition.hasOwnProperty(ConditionType.XOutOfY)) {
            const xOutOfYCondition: XOutOfYCondition = condition[ConditionType.XOutOfY];
            return {
                id: xOutOfYCondition.id,
                type: ConditionType.XOutOfY,
                conditionStatus: xOutOfYCondition.condition_status,
                question: xOutOfYCondition.question,
                quorum: Number(xOutOfYCondition.quorum),
                validators: xOutOfYCondition.validators.map(v => {
                    return {
                        status: v.status && v.status.length > 0 ? v.status[0] : undefined,
                        user: this.getUiUserFromId(state, v.principal_id)
                    }
                })
            } as UiXOutOfYCondition
        }
    }

    public mapValidationStausToPolicy(policyValidatorList: UiPolicy[], policyId: string, conditionId: string, status: boolean) {
        const updatedPolicies = policyValidatorList.map(p => {
            if (p.id === policyId) {
                const copiedConditions = p.conditions.map(c => {
                        if (c.id == conditionId && c.type == ConditionType.XOutOfY) {
                            const xouty = c as UiXOutOfYCondition;
                            return {
                                ...xouty,
                                validators: [{
                                    ...xouty.validators[0],
                                    status: status
                                }]
                            } as UiXOutOfYCondition
                        } else {
                            return c
                        }
                    }
                )
                return {
                    ...p,
                    conditions: copiedConditions,
                } as UiPolicy
            }
            return p;
        })
        return updatedPolicies;
    }

    public mapPolicyWithSecretListEntriesToUiPolicyWithSecretListEntries(state: RootState, policy: PolicyWithSecretListEntries, role: UiPolicyListEntryRole): UiPolicyWithSecretListEntries {
        let secrets: UiSecretListEntry[] = policy.secrets?.map((item) => {
            let category = undefined;
            if (item.category.length > 0) {
                if (item.category[0].hasOwnProperty('Password')) {
                    category = UiSecretCategory.Password;
                } else if (item.category[0].hasOwnProperty('Note')) {
                    category = UiSecretCategory.Note;
                }
            }
            return {
                id: item.id,
                name: item.name.length > 0 ? item.name[0] : undefined,
                category: category,
            }
        })
        return {
            id: policy.id,
            name: policy.name?.length > 0 ? policy.name[0] : undefined,
            owner: this.getUiUserFromId(state, policy.owner),
            secrets: secrets,
            beneficiaries: policy.beneficiaries?.map((item) => {
                return this.getUiUserFromId(state, item)
            }),
            conditionsLogicalOperator: policy.conditions_logical_operator?.hasOwnProperty('And') ? UiLogicalOperator.And : UiLogicalOperator.Or,
            conditionsStatus: policy.conditions_status,
            conditions: policy.conditions?.map(condition => this.mapConditionToUiCondition(state, condition)),
            dateCreated: this.nanosecondsInBigintToIsoString(policy.date_created),
            dateModified: this.nanosecondsInBigintToIsoString(policy.date_modified),
            role
        };
    }

    public getUiUserFromId(state: RootState, userId: string): UiUser{

        if(userId){
            if(state.user?.user?.id === userId) {
                return state.user?.user;
            }
            if(state.contacts?.contactsList) {
                const user = state.contacts.contactsList.find((c: UiUser) => c.id === userId);
                if (user) {
                    return user;
                }
            }
        }
        return {
            id: userId
        }
    }

    public mapUiUserTypeToUserType(uiUserType: UiUserType): UserType {
        switch (uiUserType) {
            case UiUserType.Person:
                return {'Person': null}
            case UiUserType.Company:
                return {'Company': null}
        }
    }

    public preparePolicyForCreate(uiPolicy: UiPolicy): UiPolicy {
        const conditions = uiPolicy.conditions?.map(c => {
            const {id, ...cond} = c;
            return cond;
        })
        return {
            ...uiPolicy,
            conditions
        }
    }
}

export default IoloServiceMapper;
