import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Test, TestDocument } from './schemas/test.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Test.name) private testModel: Model<TestDocument>,
  ) {}

  async createTest(userId: string): Promise<Test> {
    const uniqueUrl = uuidv4();
    const test = new this.testModel({
      userId,
      uniqueUrl,
      attempts: [],
      score: 0,
      currentDifficulty: 5,
      consecutiveCorrectAtDifficulty10: 0,
      status: 'in-progress',
    });
    return test.save();
  }

  async createTestWithUrl(userId: string, uniqueUrl: string): Promise<Test> {
    // Check if test with this URL already exists
    const existingTest = await this.testModel.findOne({ uniqueUrl }).exec();
    if (existingTest) {
      return existingTest;
    }

    const test = new this.testModel({
      userId,
      uniqueUrl,
      attempts: [],
      score: 0,
      currentDifficulty: 5,
      consecutiveCorrectAtDifficulty10: 0,
      status: 'in-progress',
    });
    return test.save();
  }

  async findByUniqueUrl(uniqueUrl: string): Promise<Test | null> {
    const test = await this.testModel
      .findOne({ uniqueUrl })
      .populate('userId', 'name email')
      .exec();
    
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    
    return test;
  }

  async findByUniqueUrlSafe(uniqueUrl: string): Promise<Test | null> {
    const test = await this.testModel
      .findOne({ uniqueUrl })
      .populate('userId', 'name email')
      .exec();
    
    return test;
  }

  async findById(testId: string, populate: boolean = true): Promise<Test> {
    let query = this.testModel.findById(testId);
    
    if (populate) {
      query = query.populate('userId', 'name email');
    }
    
    const test = await query.exec();
    
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    
    return test;
  }

  async findByUserId(userId: string): Promise<Test[]> {
    return this.testModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllTests(): Promise<Test[]> {
    return this.testModel
      .find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateTest(testId: string, updateData: any): Promise<Test> {
    // Don't populate userId in updates to avoid breaking ownership checks
    const test = await this.testModel
      .findByIdAndUpdate(testId, updateData, { new: true })
      .lean()  // Return plain object, not Mongoose document
      .exec();
    
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    
    return test as Test;
  }
}

