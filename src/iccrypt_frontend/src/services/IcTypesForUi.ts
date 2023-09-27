export enum UiSecretCategory {
    Password = "Password",
    Note = "Note",
    Document = "Document"
}

export interface UiSecret {
    id : string,
    url? : string,
    username? : string,
    date_created? : Date,
    password? : string,
    name : string,
    notes? : string,
    category : UiSecretCategory,
    date_modified? : Date,
}
