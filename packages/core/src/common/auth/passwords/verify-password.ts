import { pbkdf2, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { decomposePbkdf2PasswordHash } from './utils';

/**
 * Compare a plain text password and a hash to see if they match.
 *
 * @export
 * @param {string} plainTextPassword - The password in clear text.
 * @param {string} passwordHash - The password hash generated by the `hashPassword` function.
 * @returns {Promise<boolean>} True if the hash and the password match. False otherwise.
 */
export async function verifyPassword(plainTextPassword: string, passwordHash: string): Promise<boolean> {
  const { digestAlgorithm, iterations, salt, derivedKey, keyLength } = decomposePbkdf2PasswordHash(passwordHash);

  const password = await promisify(pbkdf2)(
    plainTextPassword,
    salt,
    iterations,
    keyLength,
    digestAlgorithm
  );
  return timingSafeEqual(password, derivedKey);
}