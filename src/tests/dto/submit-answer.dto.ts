import { IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  selectedAnswer: string;
}

