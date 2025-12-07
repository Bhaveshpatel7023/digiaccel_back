import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QuestionsService } from '../questions/questions.service';
import { UsersService } from '../users/users.service';

const topics = [
  'Mathematics',
  'Science',
  'History',
  'Geography',
  'Literature',
  'Technology',
  'Art',
  'Music',
  'Sports',
  'General Knowledge',
];

const questionTemplates = {
  Mathematics: [
    'What is the result of {num1} + {num2}?',
    'What is {num1} multiplied by {num2}?',
    'What is the square root of {num1}?',
    'What is {num1} divided by {num2}?',
    'What is {num1} percent of {num2}?',
  ],
  Science: [
    'What is the chemical symbol for {element}?',
    'What planet is known as the {descriptor}?',
    'What is the process of {process} called?',
    'What organ in the human body is responsible for {function}?',
    'What is the speed of light in {unit}?',
  ],
  History: [
    'In what year did {event} occur?',
    'Who was the {position} during {period}?',
    'What war was fought between {year1} and {year2}?',
    'Which civilization built {structure}?',
    'What document was signed in {year}?',
  ],
  Technology: [
    'What does {acronym} stand for?',
    'Who invented the {invention}?',
    'What programming language is known for {feature}?',
    'What company developed {product}?',
    'What year was {technology} introduced?',
  ],
  'General Knowledge': [
    'What is the capital of {country}?',
    'How many {item} are there in a {container}?',
    'What is the largest {type} in the world?',
    'What color is {object}?',
    'What is the currency of {country}?',
  ],
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(topic: string, difficulty: number) {
  const templates = questionTemplates[topic] || questionTemplates['General Knowledge'];
  let questionText: string = getRandomElement(templates);

  // Replace placeholders with random values
  questionText = questionText.replace('{num1}', generateRandomNumber(1, 100).toString());
  questionText = questionText.replace('{num2}', generateRandomNumber(1, 100).toString());
  questionText = questionText.replace('{element}', getRandomElement(['Gold', 'Silver', 'Oxygen', 'Carbon', 'Hydrogen']));
  questionText = questionText.replace('{descriptor}', getRandomElement(['Red Planet', 'Blue Planet', 'Ringed Planet']));
  questionText = questionText.replace('{process}', getRandomElement(['photosynthesis', 'respiration', 'digestion']));
  questionText = questionText.replace('{function}', getRandomElement(['pumping blood', 'filtering toxins', 'thinking']));
  questionText = questionText.replace('{unit}', getRandomElement(['m/s', 'km/h', 'mph']));
  questionText = questionText.replace('{event}', getRandomElement(['World War II end', 'Moon Landing', 'Berlin Wall Fall']));
  questionText = questionText.replace('{position}', getRandomElement(['President', 'Prime Minister', 'King']));
  questionText = questionText.replace('{period}', getRandomElement(['the 1960s', 'the Industrial Revolution', 'the Renaissance']));
  questionText = questionText.replace('{year1}', generateRandomNumber(1800, 1950).toString());
  questionText = questionText.replace('{year2}', generateRandomNumber(1951, 2000).toString());
  questionText = questionText.replace('{year}', generateRandomNumber(1700, 2000).toString());
  questionText = questionText.replace('{structure}', getRandomElement(['the Pyramids', 'the Great Wall', 'Stonehenge']));
  questionText = questionText.replace('{acronym}', getRandomElement(['CPU', 'RAM', 'GPU', 'SSD', 'URL']));
  questionText = questionText.replace('{invention}', getRandomElement(['telephone', 'light bulb', 'airplane']));
  questionText = questionText.replace('{feature}', getRandomElement(['web development', 'data science', 'mobile apps']));
  questionText = questionText.replace('{product}', getRandomElement(['iPhone', 'Windows', 'Android']));
  questionText = questionText.replace('{technology}', getRandomElement(['the Internet', 'smartphones', 'electric cars']));
  questionText = questionText.replace('{country}', getRandomElement(['France', 'Japan', 'Brazil', 'Canada', 'India']));
  questionText = questionText.replace('{item}', getRandomElement(['days', 'hours', 'weeks', 'months']));
  questionText = questionText.replace('{container}', getRandomElement(['year', 'week', 'day', 'dozen']));
  questionText = questionText.replace('{type}', getRandomElement(['ocean', 'desert', 'mountain', 'river']));
  questionText = questionText.replace('{object}', getRandomElement(['the sky', 'grass', 'the sun']));

  // Generate realistic options based on topic
  let options: string[];
  let correctAnswer: string;
  
  if (topic === 'Mathematics') {
    const correctNum = generateRandomNumber(1, 100);
    const wrongNums = [
      correctNum + generateRandomNumber(1, 10),
      correctNum - generateRandomNumber(1, 10),
      correctNum + generateRandomNumber(11, 20),
    ];
    options = [correctNum.toString(), ...wrongNums.map(n => n.toString())];
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    correctAnswer = correctNum.toString();
  } else if (topic === 'Science') {
    const scienceOptions = [
      ['Oxygen', 'Carbon', 'Hydrogen', 'Nitrogen'],
      ['Mars', 'Venus', 'Jupiter', 'Saturn'],
      ['Heart', 'Liver', 'Brain', 'Kidney'],
      ['Water', 'Air', 'Fire', 'Earth'],
    ];
    options = getRandomElement(scienceOptions);
    correctAnswer = options[0];
    options.sort(() => Math.random() - 0.5);
  } else if (topic === 'Geography') {
    const geoOptions = [
      ['Paris', 'London', 'Berlin', 'Madrid'],
      ['Asia', 'Africa', 'Europe', 'America'],
      ['Nile', 'Amazon', 'Ganges', 'Yangtze'],
      ['Pacific', 'Atlantic', 'Indian', 'Arctic'],
    ];
    options = getRandomElement(geoOptions);
    correctAnswer = options[0];
    options.sort(() => Math.random() - 0.5);
  } else {
    // General options for other topics
    const generalOptions = [
      ['Blue', 'Red', 'Green', 'Yellow'],
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      ['Spring', 'Summer', 'Autumn', 'Winter'],
      ['North', 'South', 'East', 'West'],
    ];
    options = getRandomElement(generalOptions);
    correctAnswer = options[0];
    options.sort(() => Math.random() - 0.5);
  }

  return {
    question: `[Difficulty ${difficulty}] ${questionText}`,
    options,
    correctAnswer,
    difficulty,
    topic,
  };
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const questionsService = app.get(QuestionsService);
  const usersService = app.get(UsersService);

  try {
    console.log('Starting seed process...');

    // Create admin user
    console.log('Creating admin user...');
    try {
      await usersService.create(
        'Admin User',
        'admin@lms.com',
        'admin123',
        true,
      );
      console.log('Admin user created: admin@lms.com / admin123');
    } catch (error) {
      console.log('Admin user might already exist');
    }

    // Check if questions already exist
    const existingCount = await questionsService.count();
    if (existingCount >= 500) {
      console.log(`⚠️  Database already has ${existingCount} questions.`);
      console.log('To reseed with new questions, first delete them from MongoDB Atlas');
      console.log('Or use: npm run reseed (after creating reseed.ts)');
      await app.close();
      return;
    }

    console.log('Generating 500 random questions...');
    const questions = [];

    // Generate questions with varying difficulties
    for (let i = 0; i < 500; i++) {
      const topic = getRandomElement(topics);
      const difficulty = generateRandomNumber(1, 10);
      const question = generateQuestion(topic, difficulty);
      questions.push(question);

      if ((i + 1) % 100 === 0) {
        console.log(`Generated ${i + 1} questions...`);
      }
    }

    console.log('Inserting questions into database...');
    await questionsService.createMany(questions);

    console.log('✅ Successfully seeded 500 questions!');
    console.log('Questions distributed across difficulties:');
    
    for (let diff = 1; diff <= 10; diff++) {
      const count = questions.filter(q => q.difficulty === diff).length;
      console.log(`  Difficulty ${diff}: ${count} questions`);
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await app.close();
  }
}

seed();

