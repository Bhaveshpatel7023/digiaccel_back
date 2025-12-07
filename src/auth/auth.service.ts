import { Injectable, UnauthorizedException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TestsService } from '../tests/tests.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => TestsService))
    private testsService: TestsService,
  ) {}

  async register(name: string, email: string, password: string, testUrl?: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(name, email, password, false, testUrl);
    const userId = (user as any)._id.toString();
    
    // If testUrl is provided, create a test for the user with that unique URL
    let test = null;
    if (testUrl && !user.isAdmin) {
      test = await this.testsService.createTestWithUrl(userId, testUrl);
    }

    const payload = { sub: userId, email: user.email, isAdmin: user.isAdmin };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      ...(test && { testId: (test as any)._id.toString(), testUrl: test.uniqueUrl }),
    };
  }

  async login(email: string, password: string, testUrl?: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = (user as any)._id.toString();
    const payload = { sub: userId, email: user.email, isAdmin: user.isAdmin };
    
    // For regular users, fetch their tests if any
    let tests = null;
    let newTest = null;
    
    if (!user.isAdmin) {
      tests = await this.testsService.findByUserId(userId);
      
      // If testUrl provided and user doesn't have this test yet, create it
      if (testUrl) {
        const hasThisTest = tests.some(t => t.uniqueUrl === testUrl);
        if (!hasThisTest) {
          newTest = await this.testsService.createTestWithUrl(userId, testUrl);
          // Add to tests array
          tests = tests || [];
          tests.push(newTest);
        }
      }
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      ...(tests && tests.length > 0 && {
        tests: tests.map(test => ({
          testId: (test as any)._id.toString(),
          uniqueUrl: test.uniqueUrl,
          status: test.status,
          score: test.score,
        })),
      }),
      ...(newTest && { 
        testId: (newTest as any)._id.toString(), 
        testUrl: newTest.uniqueUrl 
      }),
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}

