export enum UiSecretCategory {
    Password = "Password",
    Note = "Note",
    Document = "Document"
}

export interface UiSecretListEntry {
    id?: string,
    name?: string,
    category?: UiSecretCategory
}

export interface UiSecret extends UiSecretListEntry {
    url?: string,
    username?: string,
    password?: string,
    notes?: string,
    dateCreated?: string,
    dateModified?: string,
}

export interface UiPolicyListEntry {
    id?: string,
    name?: string,
    owner?: UiUser,
    role?: UiPolicyListEntryRole
    conditionStatus?: boolean,
}

export interface UiPolicy {
    id?: string,
    name?: string,
    owner?: UiUser,
    role?: UiPolicyListEntryRole
    secrets?: string[],
    beneficiaries?: Array<UiUser>,
    conditions?: Array<UiCondition>,
    conditionsStatus?: boolean,
    conditionsLogicalOperator?: LogicalOperator,
    dateCreated?: string,
    dateModified?: string,
}

export interface UiPolicyWithSecretListEntries {
    id?: string,
    name?: string,
    owner?: UiUser,
    role?: UiPolicyListEntryRole
    secrets?: UiSecretListEntry[],
    beneficiaries?: Array<UiUser>,
    conditions?: Array<UiCondition>,
    conditionsStatus?: boolean,
    conditionsLogicalOperator?: LogicalOperator,
    dateCreated?: string,
    dateModified?: string,
}

export enum LogicalOperator {
    And = "And",
    Or = "Or"
}

export interface UiCondition {
    id: string;
    type: ConditionType;
    conditionStatus: boolean,
}

export enum ConditionType{
    Undefined = "Undefined",
    LastLogin= "LastLogin",
    XOutOfY = "XOutOfY",
    FixedDateTime = "FixedDateTime",
}

export interface UiLastLoginTimeCondition extends UiCondition{
    type: ConditionType.LastLogin
    numberOfDaysSinceLastLogin: number,
}

export interface UiFixedDateTimeCondition extends UiCondition{
    type: ConditionType.FixedDateTime
    time: number,
}

export interface UiXOutOfYCondition extends UiCondition {
    type: ConditionType.XOutOfY,
    question: string,
    quorum: number,
    validators: Array<UiValidator>,
}

export interface UiValidator {
    status: boolean,
    user: UiUser
}

export enum UiPolicyListEntryRole {
    Owner = "Owner",
    Beneficiary = "Beneficiary",
    Validator = "Validator",
}

export enum UiUserType {
    Person = "Person",
    Company = "Company",
}

export interface UiUser {
    id?: string,
    type?: UiUserType,
    name?: string,
    email?: string,
    language?: string,
    dateCreated?: string,
    dateModified?: string,
    dateLastLogin?: string,

}
