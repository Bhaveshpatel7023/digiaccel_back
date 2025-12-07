import { Test, TestingModule } from '@nestjs/testing';
import { AdaptiveTestService } from './adaptive-test.service';
import { QuestionsService } from '../questions/questions.service';
import { TestsService } from './tests.service';
import { BadRequestException } from '@nestjs/common';

describe('AdaptiveTestService', () => {
  let service: AdaptiveTestService;
  let questionsService: QuestionsService;
  let testsService: TestsService;

  const mockQuestion = {
    _id: 'question123',
    question: 'Test Question',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    difficulty: 5,
    topic: 'Math',
  };

  const mockTest = {
    _id: 'test123',
    userId: 'user123',
    uniqueUrl: 'unique-url',
    attempts: [],
    score: 0,
    currentDifficulty: 5,
    consecutiveCorrectAtDifficulty10: 0,
    status: 'in-progress',
    toObject: function() { return { ...this }; }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdaptiveTestService,
        {
          provide: QuestionsService,
          useValue: {
            getRandomQuestionByDifficulty: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: TestsService,
          useValue: {
            findById: jest.fn(),
            updateTest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdaptiveTestService>(AdaptiveTestService);
    questionsService = module.get<QuestionsService>(QuestionsService);
    testsService = module.get<TestsService>(TestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNextQuestion', () => {
    it('should return a question with difficulty 5 at the start', async () => {
      jest.spyOn(testsService, 'findById').mockResolvedValue(mockTest as any);
      jest.spyOn(questionsService, 'getRandomQuestionByDifficulty').mockResolvedValue(mockQuestion as any);

      const result = await service.getNextQuestion('test123');

      expect(result).toBeDefined();
      expect(result.difficulty).toBe(5);
      expect(questionsService.getRandomQuestionByDifficulty).toHaveBeenCalledWith(5, []);
    });

    it('should throw error if test is already completed', async () => {
      const completedTest = { ...mockTest, status: 'completed' };
      jest.spyOn(testsService, 'findById').mockResolvedValue(completedTest as any);

      await expect(service.getNextQuestion('test123')).rejects.toThrow(BadRequestException);
    });

    it('should exclude already attempted questions', async () => {
      const testWithAttempts = {
        ...mockTest,
        attempts: [
          { questionId: 'q1', isCorrect: true, difficulty: 5 },
          { questionId: 'q2', isCorrect: false, difficulty: 6 },
        ],
      };
      jest.spyOn(testsService, 'findById').mockResolvedValue(testWithAttempts as any);
      jest.spyOn(questionsService, 'getRandomQuestionByDifficulty').mockResolvedValue(mockQuestion as any);

      await service.getNextQuestion('test123');

      expect(questionsService.getRandomQuestionByDifficulty).toHaveBeenCalledWith(
        5,
        expect.arrayContaining(['q1', 'q2']),
      );
    });
  });

  describe('submitAnswer', () => {
    it('should increase score when answer is correct', async () => {
      jest.spyOn(testsService, 'findById').mockResolvedValue(mockTest as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(mockQuestion as any);
      jest.spyOn(testsService, 'updateTest').mockResolvedValue(mockTest as any);

      const result = await service.submitAnswer('test123', 'question123', 'A');

      expect(result.isCorrect).toBe(true);
      expect(result.currentScore).toBe(5); // difficulty 5
    });

    it('should not increase score when answer is incorrect', async () => {
      jest.spyOn(testsService, 'findById').mockResolvedValue(mockTest as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(mockQuestion as any);
      jest.spyOn(testsService, 'updateTest').mockResolvedValue(mockTest as any);

      const result = await service.submitAnswer('test123', 'question123', 'B');

      expect(result.isCorrect).toBe(false);
      expect(result.currentScore).toBe(0);
    });

    it('should complete test after 20 questions', async () => {
      const testWith19Attempts = {
        ...mockTest,
        attempts: new Array(19).fill({ questionId: 'q', isCorrect: true, difficulty: 5 }),
      };
      jest.spyOn(testsService, 'findById').mockResolvedValue(testWith19Attempts as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(mockQuestion as any);
      
      let updatedTest: any;
      jest.spyOn(testsService, 'updateTest').mockImplementation(async (id, data) => {
        updatedTest = data;
        return data as any;
      });

      const result = await service.submitAnswer('test123', 'question123', 'A');

      expect(result.testCompleted).toBe(true);
      expect(result.completionReason).toBe('Completed 20 questions');
      expect(updatedTest.status).toBe('completed');
    });

    it('should complete test on incorrect answer at difficulty 1', async () => {
      const difficulty1Question = { ...mockQuestion, difficulty: 1 };
      jest.spyOn(testsService, 'findById').mockResolvedValue(mockTest as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(difficulty1Question as any);
      
      let updatedTest: any;
      jest.spyOn(testsService, 'updateTest').mockImplementation(async (id, data) => {
        updatedTest = data;
        return data as any;
      });

      const result = await service.submitAnswer('test123', 'question123', 'B');

      expect(result.testCompleted).toBe(true);
      expect(result.completionReason).toBe('Incorrect answer on difficulty 1');
      expect(updatedTest.status).toBe('completed');
    });

    it('should complete test after 3 consecutive correct answers at difficulty 10', async () => {
      const difficulty10Question = { ...mockQuestion, difficulty: 10 };
      const testWith2ConsecutiveCorrect = {
        ...mockTest,
        currentDifficulty: 10,
        consecutiveCorrectAtDifficulty10: 2,
      };
      
      jest.spyOn(testsService, 'findById').mockResolvedValue(testWith2ConsecutiveCorrect as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(difficulty10Question as any);
      
      let updatedTest: any;
      jest.spyOn(testsService, 'updateTest').mockImplementation(async (id, data) => {
        updatedTest = data;
        return data as any;
      });

      const result = await service.submitAnswer('test123', 'question123', 'A');

      expect(result.testCompleted).toBe(true);
      expect(result.completionReason).toBe('3 consecutive correct answers on difficulty 10');
      expect(updatedTest.status).toBe('completed');
    });

    it('should reset consecutive count on incorrect answer at difficulty 10', async () => {
      const difficulty10Question = { ...mockQuestion, difficulty: 10 };
      const testWith2ConsecutiveCorrect = {
        ...mockTest,
        currentDifficulty: 10,
        consecutiveCorrectAtDifficulty10: 2,
      };
      
      jest.spyOn(testsService, 'findById').mockResolvedValue(testWith2ConsecutiveCorrect as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(difficulty10Question as any);
      
      let updatedTest: any;
      jest.spyOn(testsService, 'updateTest').mockImplementation(async (id, data) => {
        updatedTest = data;
        return data as any;
      });

      await service.submitAnswer('test123', 'question123', 'B');

      expect(updatedTest.consecutiveCorrectAtDifficulty10).toBe(0);
    });

    it('should increase difficulty on correct answer', async () => {
      jest.spyOn(testsService, 'findById').mockResolvedValue(mockTest as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(mockQuestion as any);
      
      let updatedTest: any;
      jest.spyOn(testsService, 'updateTest').mockImplementation(async (id, data) => {
        updatedTest = data;
        return data as any;
      });

      await service.submitAnswer('test123', 'question123', 'A');

      expect(updatedTest.currentDifficulty).toBe(6); // increased from 5
    });

    it('should decrease difficulty on incorrect answer', async () => {
      jest.spyOn(testsService, 'findById').mockResolvedValue(mockTest as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(mockQuestion as any);
      
      let updatedTest: any;
      jest.spyOn(testsService, 'updateTest').mockImplementation(async (id, data) => {
        updatedTest = data;
        return data as any;
      });

      await service.submitAnswer('test123', 'question123', 'B');

      expect(updatedTest.currentDifficulty).toBe(4); // decreased from 5
    });

    it('should not increase difficulty beyond 10', async () => {
      const difficulty10Test = { ...mockTest, currentDifficulty: 10 };
      const difficulty10Question = { ...mockQuestion, difficulty: 10 };
      
      jest.spyOn(testsService, 'findById').mockResolvedValue(difficulty10Test as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(difficulty10Question as any);
      
      let updatedTest: any;
      jest.spyOn(testsService, 'updateTest').mockImplementation(async (id, data) => {
        updatedTest = data;
        return data as any;
      });

      // Answer correctly but should not complete (only 1 consecutive correct)
      difficulty10Test.consecutiveCorrectAtDifficulty10 = 0;
      await service.submitAnswer('test123', 'question123', 'A');

      expect(updatedTest.currentDifficulty).toBe(10); // stays at 10
    });

    it('should not decrease difficulty below 1', async () => {
      const difficulty1Test = { ...mockTest, currentDifficulty: 1 };
      const difficulty1Question = { ...mockQuestion, difficulty: 1 };
      
      jest.spyOn(testsService, 'findById').mockResolvedValue(difficulty1Test as any);
      jest.spyOn(questionsService, 'findById').mockResolvedValue(difficulty1Question as any);
      
      let updatedTest: any;
      jest.spyOn(testsService, 'updateTest').mockImplementation(async (id, data) => {
        updatedTest = data;
        return data as any;
      });

      // Answer correctly to avoid test completion
      await service.submitAnswer('test123', 'question123', 'A');

      // Should increase to 2
      expect(updatedTest.currentDifficulty).toBe(2);
    });
  });
});

