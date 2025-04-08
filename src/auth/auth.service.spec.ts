import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { MongoError } from 'mongodb';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    // Mock bcrypt.compare for each test
    jest.spyOn(bcrypt, 'compare');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user and return access token', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const createdUser = {
        _id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
      };
      const token = 'test-token';

      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.signup(createUserDto);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: createdUser.email,
        sub: createdUser._id,
      });
      expect(result).toEqual({ access_token: token });
    });

    it('should handle duplicate email error from MongoDB', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      // Simulate MongoDB duplicate key error (code 11000) with proper error message
      const duplicateError = new MongoError('E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "existing@example.com" }');
      duplicateError.code = 11000;
      // No need to set name as it's already 'MongoError' by default
      mockUsersService.create.mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(service.signup(createUserDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should propagate other errors during user creation', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const error = new Error('Database connection failed');
      mockUsersService.create.mockRejectedValue(error);

      // Act & Assert
      await expect(service.signup(createUserDto)).rejects.toThrow(error);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
    
    it('should handle network errors during user creation', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const networkError = new Error('Network connection failed');
      networkError.name = 'NetworkError';
      mockUsersService.create.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.signup(createUserDto)).rejects.toThrow(networkError);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });
  
  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = {
        _id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
      };
      const token = 'test-token';
      
      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue(token);
      
      // Act
      const result = await service.login(loginDto);
      
      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user._id,
      });
      expect(result).toEqual({ access_token: token });
    });
    
    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      
      mockUsersService.findByEmail.mockResolvedValue(null);
      
      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
    
    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };
      const user = {
        _id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
      };
      
      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      
      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
    
    it('should handle unexpected errors during login', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const unexpectedError = new Error('Unexpected database error');
      
      mockUsersService.findByEmail.mockRejectedValue(unexpectedError);
      
      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(unexpectedError);
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });
  });
});