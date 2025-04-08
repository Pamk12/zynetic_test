import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user and return access token', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expected = { access_token: 'test-token' };
      mockAuthService.signup.mockResolvedValue(expected);

      const result = await controller.signup(dto);

      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException when email is invalid', async () => {
      const dto = {
        email: 'invalid-email',
        password: 'password123',
      };

      mockAuthService.signup.mockImplementation(() => {
        throw new BadRequestException('email must be an email');
      });

      await expect(controller.signup(dto as CreateUserDto)).rejects.toThrow(BadRequestException);
      expect(authService.signup).toHaveBeenCalledWith(dto as CreateUserDto);
    });

    it('should throw BadRequestException when password is too short', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'short',
      };

      mockAuthService.signup.mockImplementation(() => {
        throw new BadRequestException('password must be longer than or equal to 6 characters');
      });

      await expect(controller.signup(dto as CreateUserDto)).rejects.toThrow(BadRequestException);
      expect(authService.signup).toHaveBeenCalledWith(dto as CreateUserDto);
    });

    it('should handle ConflictException when email already exists', async () => {
      const dto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockAuthService.signup.mockImplementation(() => {
        throw new ConflictException('Email already exists');
      });

      await expect(controller.signup(dto)).rejects.toThrow(ConflictException);
      expect(authService.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expected = { access_token: 'test-token' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      mockAuthService.login.mockImplementation(() => {
        throw new UnauthorizedException('Invalid credentials');
      });

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException when email format is invalid', async () => {
      const dto = {
        email: 'invalid-email',
        password: 'password123',
      };

      mockAuthService.login.mockImplementation(() => {
        throw new BadRequestException('email must be an email');
      });

      await expect(controller.login(dto as LoginDto)).rejects.toThrow(BadRequestException);
      expect(authService.login).toHaveBeenCalledWith(dto as LoginDto);
    });

    it('should throw BadRequestException when required fields are missing', async () => {
      const dto = {
        email: 'test@example.com',
      };

      mockAuthService.login.mockImplementation(() => {
        throw new BadRequestException('password should not be empty');
      });

      await expect(controller.login(dto as LoginDto)).rejects.toThrow(BadRequestException);
      expect(authService.login).toHaveBeenCalledWith(dto as LoginDto);
    });
  });
});
