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
    dateCreated?: Date,
    dateModified?: Date,
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
    conditionArg: number,
    dateCreated?: Date,
    dateModified?: Date,
}

export interface UiTestamentResponse {
    id?: string,
    name?: string,
    testator?: UiUser,
    role?: UiTestamentListEntryRole
    conditionStatus?: boolean,
    secrets?: UiSecretListEntry[],
    heirs?: Array<UiUser>,
    conditionArg: number,
    dateCreated?: Date,
    dateModified?: Date,
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
    userVaultId?: bigint,
    dateCreated?: Date,
    dateModified?: Date,
    dateLastLogin?: Date,

}
