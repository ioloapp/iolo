export class IoloError extends Error {
    constructor(message) {
        super(message);
        this.name = "IoloError";
    }
}

export class LoginFailedException extends IoloError {
    constructor() {
        super('login failed');
        this.name = "UserAlreadyExists";
    }
}

export class UserAlreadyExists extends IoloError {
    constructor(message) {
        super(message);
        this.name = "UserAlreadyExists";
    }
}

export class UserDoesNotExist extends IoloError {
    constructor(message) {
        super(message);
        this.name = "UserDoesNotExist";
    }
}

export class UserDeletionFailed extends IoloError {
    constructor(message) {
        super(message);
        this.name = "UserDeletionFailed";
    }
}

export class UserVaultCreationFailed extends IoloError {
    constructor(message) {
        super(message);
        this.name = "UserVaultCreationFailed";
    }

}

export class UserVaultDoesNotExist extends IoloError {
    constructor(message) {
        super(message);
        this.name = "UserVaultDoesNotExist";
    }
}

export class SecretDoesNotExist extends IoloError {
    constructor(message) {
        super(message);
        this.name = "SecretDoesNotExist";
    }
}

export class SecretHasNoId extends IoloError {
    constructor(message) {
        super(message);
        this.name = "SecretHasNoId";
    }
}

export class SecretAlreadyExists extends IoloError {
    constructor(message) {
        super(message);
        this.name = "SecretAlreadyExists";
    }
}

export class TestamentAlreadyExists extends IoloError {
    constructor(message) {
        super(message);
        this.name = "TestamentAlreadyExists";
    }
}

export class TestamentDoesNotExist extends IoloError {
    constructor(message) {
        super(message);
        this.name = "TestamentDoesNotExist";
    }
}

export class InvalidTestamentCondition extends IoloError {
    constructor(message) {
        super(message);
        this.name = "InvalidTestamentCondition";
    }
}

export class Unauthorized extends IoloError {
    constructor(message) {
        super(message);
        this.name = "Unauthorized";
    }
}

export class NoTestamentsForHeir extends IoloError {
    constructor(message) {
        super(message);
        this.name = "NoTestamentsForHeir";
    }
}

export class KeyGenerationNotAllowed extends IoloError {
    constructor(message) {
        super(message);
        this.name = "KeyGenerationNotAllowed";
    }
}

export class PrincipalCreationFailed extends IoloError {
    constructor(message) {
        super(message);
        this.name = "PrincipalCreationFailed";
    }
}
