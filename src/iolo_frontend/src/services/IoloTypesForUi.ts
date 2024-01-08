import {XOutOfYCondition} from "../../../declarations/iolo_backend/iolo_backend.did";

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

export interface UiTestament extends UiTestamentListEntry {
    secrets?: string[],
    heirs?: Array<UiUser>,
    conditions?: Array<UiTimeBasedCondition | UiXOutOfYCondition>,
    dateCreated?: string,
    dateModified?: string,
}

export interface UiTestamentResponse {
    id?: string,
    name?: string,
    testator?: UiUser,
    role?: UiTestamentListEntryRole
    conditionStatus?: boolean,
    secrets?: UiSecretListEntry[],
    heirs?: Array<UiUser>,
    conditions?: Array<UiTimeBasedCondition | UiXOutOfYCondition>,
    dateCreated?: string,
    dateModified?: string,
}

export interface UiCondition {
    id: string;
    order: number
    type: string;
    conditionStatus: boolean,
}

export interface UiTimeBasedCondition extends UiCondition{
    type: 'TimeBasedCondition'
    numberOfDaysSinceLastLogin: number,
}

export interface UiXOutOfYCondition extends UiCondition {
    type: 'XOutOfYCondition'
    quorum: number,
    confirmers: Array<UiConfirmer>,
}

export interface UiConfirmer {
    status: boolean,
    user: UiUser
}

export enum UiTestamentListEntryRole {
    Testator = "Testator",
    Heir = "Heir"
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
