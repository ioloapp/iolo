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
}

export interface UiTestament extends UiTestamentListEntry {
    secrets?: string[],
    heirs?: Array<UiUser>,
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
