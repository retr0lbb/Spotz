import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { usersTable } from '../drizzle/schemas';
import { TokenService } from '../common/services/token-service';
import { EncryptService } from '../common/services/encrypt-service';
import { type RegisterDTO } from './dto/register.dto';
import { type LoginDTO } from './dto/login.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly tokenService: TokenService,
    private readonly encryptService: EncryptService,
  ) {}

  async register(dto: RegisterDTO) {
    const [existing] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, dto.email));

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.encryptService.hash(dto.password);
    const [user] = await this.db
      .insert(usersTable)
      .values({
        username: dto.username,
        email: dto.email,
        passwordHash,
      })
      .returning();

    const accessToken = this.tokenService.generateAccess(
      user.id,
      user.username,
    );
    return { accessToken };
  }

  async login(dto: LoginDTO) {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, dto.email));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.encryptService.compare(
      dto.password,
      user.passwordHash!,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccess(
      user.id,
      user.username,
    );
    return { accessToken };
  }
}
