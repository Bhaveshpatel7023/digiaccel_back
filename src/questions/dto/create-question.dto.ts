import { IsString, IsArray, IsNumber, Min, Max, ArrayMinSize, IsOptional } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @IsString()
  correctAnswer: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  difficulty: number;

  @IsOptional()
  @IsString()
  topic?: string;
}

