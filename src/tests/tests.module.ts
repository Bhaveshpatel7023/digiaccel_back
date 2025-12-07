import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { AdaptiveTestService } from './adaptive-test.service';
import { Test, TestSchema } from './schemas/test.schema';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Test.name, schema: TestSchema }]),
    QuestionsModule,
  ],
  controllers: [TestsController],
  providers: [TestsService, AdaptiveTestService],
  exports: [TestsService],
})
export class TestsModule {}

