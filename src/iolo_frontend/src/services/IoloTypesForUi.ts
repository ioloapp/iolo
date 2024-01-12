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

export interface UiTestamentListEntry {
    id?: string,
    name?: string,
    testator?: UiUser,
    role?: UiTestamentListEntryRole
    conditionStatus?: boolean,
}

export interface UiTestament {
    id?: string,
    name?: string,
    testator?: UiUser,
    role?: UiTestamentListEntryRole
    secrets?: string[],
    heirs?: Array<UiUser>,
    conditions?: Array<UiCondition>,
    conditionsStatus?: boolean,
    conditionsLogicalOperator?: LogicalOperator,
    dateCreated?: string,
    dateModified?: string,
}

export interface UiTestamentResponse {
    id?: string,
    name?: string,
    testator?: UiUser,
    role?: UiTestamentListEntryRole
    secrets?: UiSecretListEntry[],
    heirs?: Array<UiUser>,
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
    TimeBasedCondition= "TimeBasedCondition",
    XOutOfYCondition = "XOutOfYCondition"
}

export interface UiTimeBasedCondition extends UiCondition{
    type: ConditionType.TimeBasedCondition
    numberOfDaysSinceLastLogin: number,
}

export interface UiXOutOfYCondition extends UiCondition {
    type: ConditionType.XOutOfYCondition
    quorum: number,
    validators: Array<UiValidator>,
}

export interface UiValidator {
    status: boolean,
    user: UiUser
}

export enum UiTestamentListEntryRole {
    Testator = "Testator",
    Heir = "Heir",
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
    userVaultId?: bigint,
    dateCreated?: string,
    dateModified?: string,
    dateLastLogin?: string,

}
