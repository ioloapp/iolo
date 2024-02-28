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
} from "../error/Errors";

export function mapError(input: Error): IoloError{
    console.error('error', input);
    if(input) {
        if (input.hasOwnProperty('UserAlreadyExists')) {
            return new UserAlreadyExists(input['UserAlreadyExists'])
        } else if (input.hasOwnProperty('UserDoesNotExist')) {
            return new UserDoesNotExist(input['UserDoesNotExist'])
        } else if (input.hasOwnProperty('UserDeletionFailed')) {
            return new UserDeletionFailed(input['UserDeletionFailed'])
        } else if (input.hasOwnProperty('SecretDoesNotExist')) {
            return new SecretDoesNotExist(input['SecretDoesNotExist'])
        } else if (input.hasOwnProperty('SecretHasNoId')) {
            return new SecretHasNoId(input['SecretHasNoId'])
        } else if (input.hasOwnProperty('SecretAlreadyExists')) {
            return new SecretAlreadyExists(input['SecretAlreadyExists'])
        }  else if (input.hasOwnProperty('TestamentAlreadyExists')) {
            return new TestamentAlreadyExists(input['TestamentAlreadyExists'])
        }  else if (input.hasOwnProperty('TestamentDoesNotExist')) {
            return new TestamentDoesNotExist(input['TestamentDoesNotExist'])
        }  else if (input.hasOwnProperty('InvalidTestamentCondition')) {
            return new InvalidTestamentCondition(input.message)
        }  else if (input.hasOwnProperty('Unauthorized')) {
            return new Unauthorized(input['Unauthorized'])
        } else if (input.hasOwnProperty('NoTestamentsForHeir')) {
            return new NoTestamentsForBeneficiary(input['NoTestamentsForHeir'])
        }  else if (input.name ===  'KeyGenerationNotAllowed') {
            return new KeyGenerationNotAllowed(input.message);
        } else if (input.name === 'PrincipalCreationFailed') {
            // Frontend error, not from backend
            return new PrincipalCreationFailed(input.message);
        }
        throw input;
    }
    return new IoloError('A unknown error occurred');
}
