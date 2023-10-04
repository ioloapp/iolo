export enum UiSecretCategory {
    Password = "Password",
    Note = "Note",
    Document = "Document"
}

export interface UiSecretListEntry {
    id? : string,
    name? : string,
    category? : UiSecretCategory
}

export interface UiSecret extends UiSecretListEntry{
    url? : string,
    username? : string,
    date_created? : Date,
    password? : string,
    notes? : string,
    date_modified? : Date,
}

export interface UiTestament {
    id? : string,
    name? : string,
    testator? : string,
    secrets? : Array<string>,
    heirs? : Array<string>,
    date_created? : Date,
    date_modified? : Date,
}
