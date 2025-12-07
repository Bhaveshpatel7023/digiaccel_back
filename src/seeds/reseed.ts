import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QuestionsService } from '../questions/questions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from '../questions/schemas/question.schema';

async function reseed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const questionsService = app.get(QuestionsService);
  const questionModel = app.get<Model<Question>>(getModelToken(Question.name));

  try {
    console.log('🗑️  Deleting all existing questions...');
    const deleteResult = await questionModel.deleteMany({}).exec();
    console.log(`✅ Deleted ${deleteResult.deletedCount} questions`);

    console.log('\n🔄 Running seed script...');
    await app.close();
    
    // Import and run the seed
    console.log('Please run: npm run seed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

reseed();

