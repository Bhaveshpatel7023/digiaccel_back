import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TestDocument = Test & Document;

export interface QuestionAttempt {
  questionId: Types.ObjectId;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  difficulty: number;
  attemptedAt: Date;
}

@Schema({ timestamps: true })
export class Test {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  uniqueUrl: string;

  @Prop({ type: [Object], default: [] })
  attempts: QuestionAttempt[];

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 5 })
  currentDifficulty: number;

  @Prop({ default: 0 })
  consecutiveCorrectAtDifficulty10: number;

  @Prop({ default: 'in-progress', enum: ['in-progress', 'completed'] })
  status: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  completionReason?: string;
}

export const TestSchema = SchemaFactory.createForClass(Test);

