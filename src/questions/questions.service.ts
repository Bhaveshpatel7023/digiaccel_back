import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const question = new this.questionModel(createQuestionDto);
    return question.save();
  }

  async findAll(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async findById(id: string): Promise<Question> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async findByDifficulty(difficulty: number): Promise<Question[]> {
    return this.questionModel.find({ difficulty }).exec();
  }

  async getRandomQuestionByDifficulty(difficulty: number, excludeIds: string[] = []): Promise<Question | null> {
    const questions = await this.questionModel
      .find({
        difficulty,
        _id: { $nin: excludeIds },
      })
      .exec();

    if (questions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.questionModel
      .findByIdAndUpdate(id, updateQuestionDto, { new: true })
      .exec();
    
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    
    return question;
  }

  async delete(id: string): Promise<void> {
    const result = await this.questionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Question not found');
    }
  }

  async count(): Promise<number> {
    return this.questionModel.countDocuments().exec();
  }

  async createMany(questions: CreateQuestionDto[]): Promise<Question[]> {
    return this.questionModel.insertMany(questions);
  }
}

