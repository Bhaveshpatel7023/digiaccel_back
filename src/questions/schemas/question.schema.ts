import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true, type: [String] })
  options: string[];

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ required: true, min: 1, max: 10 })
  difficulty: number;

  @Prop()
  topic?: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

