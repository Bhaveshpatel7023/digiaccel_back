import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { TestsService } from './tests.service';
import { AdaptiveTestService } from './adaptive-test.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('tests')
export class TestsController {
  constructor(
    private testsService: TestsService,
    private adaptiveTestService: AdaptiveTestService,
  ) {}

  // User endpoint - Get test by unique URL
  @Get('url/:uniqueUrl')
  async getTestByUrl(@Param('uniqueUrl') uniqueUrl: string) {
    try {
      const test = await this.testsService.findByUniqueUrl(uniqueUrl);
      return {
        testId: (test as any)._id,
        uniqueUrl: test.uniqueUrl,
        status: test.status,
        exists: true,
      };
    } catch (error) {
      // Test doesn't exist yet - it will be created when user registers
      return {
        uniqueUrl: uniqueUrl,
        exists: false,
        message: 'Test will be created upon registration',
      };
    }
  }

  // User endpoint - Start a new test
  @Post(':testId/start')
  @UseGuards(JwtAuthGuard)
  async startTest(@Param('testId') testId: string, @Request() req) {
    // Verify test belongs to user (don't populate to get raw userId)
    const test = await this.testsService.findById(testId, false);
    
    const testUserId = (test.userId as any).toString();
    const requestUserId = req.user.userId;
    
    if (testUserId !== requestUserId) {
      throw new NotFoundException('Test not found');
    }

    // Get first question
    const firstQuestion = await this.adaptiveTestService.getNextQuestion(testId);
    
    return {
      message: 'Test started',
      currentDifficulty: 5,
      question: firstQuestion,
    };
  }

  // User endpoint - Submit answer and get next question
  @Post(':testId/questions/:questionId/answer')
  @UseGuards(JwtAuthGuard)
  async submitAnswer(
    @Param('testId') testId: string,
    @Param('questionId') questionId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Request() req,
  ) {
    // Verify test belongs to user (don't populate to get raw userId)
    const test = await this.testsService.findById(testId, false);
    
    const testUserId = (test.userId as any).toString();
    const requestUserId = req.user.userId;
    
    console.log('Submit Answer - Test userId:', testUserId);
    console.log('Submit Answer - Request userId:', requestUserId);
    console.log('Submit Answer - Match:', testUserId === requestUserId);
    
    if (testUserId !== requestUserId) {
      console.error('Submit Answer - User ID mismatch!');
      throw new NotFoundException('Test not found');
    }

    // Submit answer
    const result = await this.adaptiveTestService.submitAnswer(
      testId,
      questionId,
      submitAnswerDto.selectedAnswer,
    );

    // Get next question if test is not completed
    let nextQuestion = null;
    if (!result.testCompleted) {
      nextQuestion = await this.adaptiveTestService.getNextQuestion(testId);
    }

    return {
      ...result,
      nextQuestion,
    };
  }

  // Admin endpoint - Get test details and results
  @Get(':testId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTestDetails(@Param('testId') testId: string) {
    return this.testsService.findById(testId);
  }

  // Admin endpoint - Get all tests
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllTests() {
    return this.testsService.getAllTests();
  }

  // Admin endpoint - Generate a unique test URL
  @Post('generate-url')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async generateTestUrl() {
    const { v4: uuidv4 } = require('uuid');
    const uniqueUrl = uuidv4();
    return {
      uniqueUrl,
      testUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test/${uniqueUrl}`,
    };
  }

  // User endpoint - Get my tests
  @Get('my-tests')
  @UseGuards(JwtAuthGuard)
  async getMyTests(@Request() req) {
    return this.testsService.findByUserId(req.user.userId);
  }

  // Debug endpoint - Check test ownership
  @Get('debug/:testId')
  @UseGuards(JwtAuthGuard)
  async debugTest(@Param('testId') testId: string, @Request() req) {
    try {
      const test = await this.testsService.findById(testId, false);
      return {
        testId: testId,
        testUserId: (test.userId as any).toString(),
        requestUserId: req.user.userId,
        match: (test.userId as any).toString() === req.user.userId,
        testExists: !!test,
        testStatus: test.status,
      };
    } catch (error) {
      return {
        error: error.message,
        testId: testId,
        requestUserId: req.user.userId,
      };
    }
  }
}

