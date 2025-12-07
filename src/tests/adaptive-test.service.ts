import { Injectable, BadRequestException } from '@nestjs/common';
import { QuestionsService } from '../questions/questions.service';
import { TestsService } from './tests.service';
import { QuestionAttempt } from './schemas/test.schema';

@Injectable()
export class AdaptiveTestService {
  constructor(
    private questionsService: QuestionsService,
    private testsService: TestsService,
  ) {}

  /**
   * Adaptive Test Algorithm:
   * - Starts with difficulty 5
   * - Correct answer -> increase difficulty (max 10)
   * - Incorrect answer -> decrease difficulty (min 1)
   * - Test ends when:
   *   1. 20 questions attempted
   *   2. Incorrect answer on difficulty 1
   *   3. 3 consecutive correct answers on difficulty 10
   */
  async getNextQuestion(testId: string) {
    // Don't populate userId to avoid breaking ownership checks
    const test = await this.testsService.findById(testId, false);

    if (test.status === 'completed') {
      throw new BadRequestException('Test is already completed');
    }

    // Get list of already attempted question IDs
    const attemptedQuestionIds = test.attempts.map((a) => a.questionId.toString());

    // Get a random question with the current difficulty that hasn't been attempted
    const question = await this.questionsService.getRandomQuestionByDifficulty(
      test.currentDifficulty,
      attemptedQuestionIds,
    );

    if (!question) {
      // No more questions available at this difficulty, try to find at nearby difficulties
      const nearbyQuestion = await this.findNearbyDifficultyQuestion(
        test.currentDifficulty,
        attemptedQuestionIds,
      );
      
      if (!nearbyQuestion) {
        // End test if no questions available
        await this.completeTest(testId, 'No more questions available');
        return null;
      }
      
      return {
        questionId: (nearbyQuestion as any)._id,
        question: nearbyQuestion.question,
        options: nearbyQuestion.options,
        difficulty: nearbyQuestion.difficulty,
      };
    }

    return {
      questionId: (question as any)._id,
      question: question.question,
      options: question.options,
      difficulty: question.difficulty,
    };
  }

  async submitAnswer(testId: string, questionId: string, selectedAnswer: string) {
    // Don't populate userId to avoid breaking ownership checks
    const test = await this.testsService.findById(testId, false);

    if (test.status === 'completed') {
      throw new BadRequestException('Test is already completed');
    }

    // Get the question details
    const question = await this.questionsService.findById(questionId);
    const isCorrect = question.correctAnswer === selectedAnswer;

    // Create attempt record
    const attempt: QuestionAttempt = {
      questionId: (question as any)._id,
      question: question.question,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      difficulty: question.difficulty,
      attemptedAt: new Date(),
    };

    // Add attempt to test
    test.attempts.push(attempt);

    // Update score based on difficulty
    if (isCorrect) {
      test.score += question.difficulty;
    }

    // Update consecutive correct count for difficulty 10
    if (question.difficulty === 10 && isCorrect) {
      test.consecutiveCorrectAtDifficulty10 += 1;
    } else {
      test.consecutiveCorrectAtDifficulty10 = 0;
    }

    // Check completion conditions
    let shouldComplete = false;
    let completionReason = '';

    // Condition 1: 20 questions attempted
    if (test.attempts.length >= 20) {
      shouldComplete = true;
      completionReason = 'Completed 20 questions';
    }
    // Condition 2: Incorrect answer on difficulty 1
    else if (question.difficulty === 1 && !isCorrect) {
      shouldComplete = true;
      completionReason = 'Incorrect answer on difficulty 1';
    }
    // Condition 3: 3 consecutive correct on difficulty 10
    else if (test.consecutiveCorrectAtDifficulty10 >= 3) {
      shouldComplete = true;
      completionReason = '3 consecutive correct answers on difficulty 10';
    }

    if (shouldComplete) {
      test.status = 'completed';
      test.completedAt = new Date();
      test.completionReason = completionReason;
    } else {
      // Adjust difficulty for next question
      test.currentDifficulty = this.calculateNextDifficulty(
        test.currentDifficulty,
        isCorrect,
      );
    }

    // Save updated test
    const updatedTest = await this.testsService.updateTest(testId, (test as any).toObject());

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      currentScore: test.score,
      testCompleted: shouldComplete,
      completionReason: shouldComplete ? completionReason : undefined,
      totalQuestions: test.attempts.length,
    };
  }

  private calculateNextDifficulty(currentDifficulty: number, isCorrect: boolean): number {
    if (isCorrect) {
      // Increase difficulty, max 10
      return Math.min(currentDifficulty + 1, 10);
    } else {
      // Decrease difficulty, min 1
      return Math.max(currentDifficulty - 1, 1);
    }
  }

  private async findNearbyDifficultyQuestion(
    targetDifficulty: number,
    excludeIds: string[],
  ) {
    // Try difficulties within ±2 range
    const range = [0, 1, -1, 2, -2];
    
    for (const offset of range) {
      const difficulty = targetDifficulty + offset;
      if (difficulty >= 1 && difficulty <= 10) {
        const question = await this.questionsService.getRandomQuestionByDifficulty(
          difficulty,
          excludeIds,
        );
        if (question) {
          return question;
        }
      }
    }
    
    return null;
  }

  private async completeTest(testId: string, reason: string) {
    await this.testsService.updateTest(testId, {
      status: 'completed',
      completedAt: new Date(),
      completionReason: reason,
    } as any);
  }
}

