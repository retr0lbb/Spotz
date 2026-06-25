import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

@Injectable()
export class EncryptService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const deliver_key = (await scryptAsync(
      password,
      salt,
      KEY_LENGTH,
    )) as Buffer;

    const hash = deliver_key.toString('hex');

    const passwordHash = `${salt}:${hash}`;

    return passwordHash;
  }

  async compare(password: string, hashedPassword: string) {
    const [salt, hash] = hashedPassword.split(':');

    const derivedKey = (await scryptAsync(
      password,
      salt,
      KEY_LENGTH,
    )) as Buffer;

    const storedKey = Buffer.from(hash, 'hex');

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(storedKey, derivedKey);
  }
}
