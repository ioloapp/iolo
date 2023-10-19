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
    date_created?: Date,
    date_modified?: Date,
}

export interface UiTestamentListEntry {
    id?: string,
    name?: string,
    testator?: UiUser,
}

export interface UiTestament extends UiTestamentListEntry {
    secrets?: UiSecretListEntry[],
    heirs?: Array<UiUser>,
    date_created?: Date,
    date_modified?: Date,
}

export enum UserType {
    Person = "Person",
    Company = "Company",
}

export interface UiUser {
    id?: string,
    type?: UserType,
    name?: string,
    firstname?: string,
    email?: string,
}
