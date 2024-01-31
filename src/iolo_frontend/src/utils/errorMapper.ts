import {
    InvalidTestamentCondition,
    IoloError,
    KeyGenerationNotAllowed,
    NoTestamentsForBeneficiary,
    PrincipalCreationFailed,
    SecretAlreadyExists,
    SecretDoesNotExist,
    SecretHasNoId,
    TestamentAlreadyExists,
    TestamentDoesNotExist,
    Unauthorized,
    UserAlreadyExists,
    UserDeletionFailed,
    UserDoesNotExist,
    UserVaultCreationFailed,
    UserVaultDoesNotExist
} from "../error/Errors";

export function mapError(input: Error): IoloError{
    console.error('error', input);
    if(input) {
        if (input.hasOwnProperty('UserAlreadyExists')) {
            throw new UserAlreadyExists(input['UserAlreadyExists'])
        } else if (input.hasOwnProperty('UserDoesNotExist')) {
            throw new UserDoesNotExist(input['UserDoesNotExist'])
        } else if (input.hasOwnProperty('UserDeletionFailed')) {
            throw new UserDeletionFailed(input['UserDeletionFailed'])
        } else if (input.hasOwnProperty('UserVaultCreationFailed')) {
            throw new UserVaultCreationFailed(input['UserVaultCreationFailed'])
        } else if (input.hasOwnProperty('UserVaultDoesNotExist')) {
            throw new UserVaultDoesNotExist(input['UserVaultDoesNotExist'])
        } else if (input.hasOwnProperty('SecretDoesNotExist')) {
            throw new SecretDoesNotExist(input['SecretDoesNotExist'])
        } else if (input.hasOwnProperty('SecretHasNoId')) {
            throw new SecretHasNoId(input['SecretHasNoId'])
        } else if (input.hasOwnProperty('SecretAlreadyExists')) {
            throw new SecretAlreadyExists(input['SecretAlreadyExists'])
        }  else if (input.hasOwnProperty('TestamentAlreadyExists')) {
            throw new TestamentAlreadyExists(input['TestamentAlreadyExists'])
        }  else if (input.hasOwnProperty('TestamentDoesNotExist')) {
            throw new TestamentDoesNotExist(input['TestamentDoesNotExist'])
        }  else if (input.hasOwnProperty('InvalidTestamentCondition')) {
            throw new InvalidTestamentCondition(input.message)
        }  else if (input.hasOwnProperty('Unauthorized')) {
            throw new Unauthorized(input['Unauthorized'])
        } else if (input.hasOwnProperty('NoTestamentsForHeir')) {
            throw new NoTestamentsForBeneficiary(input['NoTestamentsForHeir'])
        }  else if (input.name ===  'KeyGenerationNotAllowed') {
            throw new KeyGenerationNotAllowed(input.message);
        } else if (input.name === 'PrincipalCreationFailed') {
            // Frontend error, not from backend
            throw new PrincipalCreationFailed(input.message);
        }
        throw input;
    }
    throw new IoloError('A unknown error occurred');
}
