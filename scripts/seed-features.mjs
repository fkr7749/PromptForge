import { PrismaClient } from '../packages/database/generated/client/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Load DATABASE_URL from .env files ───────────────────────────────────────

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        return trimmed.slice('DATABASE_URL='.length).trim();
      }
    }
  } catch {
    // file not found or unreadable
  }
  return null;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const envCandidates = [
  path.join(root, 'packages', 'database', '.env'),
  path.join(root, 'apps', 'frontend', '.env.local'),
  path.join(root, 'apps', 'frontend', '.env'),
];

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  for (const candidate of envCandidates) {
    databaseUrl = loadEnvFile(candidate);
    if (databaseUrl) {
      console.log(`Loaded DATABASE_URL from: ${candidate}`);
      break;
    }
  }
}

if (!databaseUrl) {
  console.error('ERROR: Could not find DATABASE_URL in any .env file.');
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;

// ─── Prisma Client ────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

// ─── Seed Helpers ─────────────────────────────────────────────────────────────

async function seedEvalSuites(prompts) {
  if (prompts.length === 0) {
    console.log('No prompts found — skipping EvalSuite seeding.');
    return;
  }

  const dimensions = [
    { name: 'Clarity',      weight: 0.4, rubric: 'Is the output clear and easy to understand?' },
    { name: 'Accuracy',     weight: 0.3, rubric: 'Is the output factually accurate?' },
    { name: 'Completeness', weight: 0.3, rubric: 'Does the output fully address the task?' },
  ];

  const sampleInputSets = [
    { topic: 'climate change',  audience: 'general public',  length: 'short' },
    { topic: 'machine learning', audience: 'beginners',       length: 'medium' },
    { topic: 'healthy eating',   audience: 'teenagers',       length: 'detailed' },
  ];

  const targetPrompts = prompts.slice(0, 2);

  for (const prompt of targetPrompts) {
    const suite = await prisma.evalSuite.create({
      data: {
        promptId:   prompt.id,
        name:       'Quality Eval',
        dimensions: dimensions,
        cases: {
          create: sampleInputSets.map((inputVars) => ({
            input:    inputVars,
            expected: null,
          })),
        },
      },
      include: { cases: true },
    });
    console.log(
      `Created EvalSuite "${suite.name}" (id: ${suite.id}) with ${suite.cases.length} cases for prompt "${prompt.title}".`
    );
  }
}

async function seedBenchmarkSuites(prompts) {
  if (prompts.length === 0) {
    console.log('No prompts found — skipping BenchmarkSuite seeding.');
    return;
  }

  const prompt = prompts[0];
  const cases = [
    { input: { query: 'Explain photosynthesis in simple terms.' },       expectedPattern: 'photosynthesis' },
    { input: { query: 'Summarise the French Revolution in 3 sentences.' }, expectedPattern: 'revolution' },
    { input: { query: 'Write a haiku about the ocean.' },                  expectedPattern: 'ocean' },
  ];

  const suite = await prisma.benchmarkSuite.create({
    data: {
      promptId: prompt.id,
      name:     'Core Benchmark',
      cases:    cases,
    },
  });
  console.log(`Created BenchmarkSuite "${suite.name}" (id: ${suite.id}) for prompt "${prompt.title}".`);
}

async function seedRagWorkspace(users) {
  if (users.length === 0) {
    console.log('No users found — skipping RagWorkspace seeding.');
    return;
  }

  const user = users[0];
  const workspace = await prisma.ragWorkspace.create({
    data: {
      userId:      user.id,
      name:        'Demo Knowledge Base',
      description: 'Sample workspace for demonstrating RAG capabilities.',
      documents: {
        create: [
          {
            name:       'Introduction to Prompt Engineering',
            content:    'Prompt engineering is the practice of designing and refining inputs to AI language models to achieve desired outputs. It involves understanding model behaviour, crafting clear instructions, and iterating on examples.',
            chunkCount: 2,
          },
          {
            name:       'Best Practices for AI Safety',
            content:    'AI safety focuses on ensuring that artificial intelligence systems behave in alignment with human values and intentions. Key principles include transparency, fairness, robustness, and privacy.',
            chunkCount: 2,
          },
        ],
      },
    },
    include: { documents: true },
  });
  console.log(
    `Created RagWorkspace "${workspace.name}" (id: ${workspace.id}) with ${workspace.documents.length} documents for user "${user.username}".`
  );
}

async function seedDataset(users) {
  if (users.length === 0) {
    console.log('No users found — skipping Dataset seeding.');
    return;
  }

  const user = users[0];
  const rows = [
    { input: 'What is the capital of France?',       output: 'Paris',       category: 'geography' },
    { input: 'Explain Newton\'s first law.',         output: 'An object at rest stays at rest unless acted upon by a force.', category: 'physics' },
    { input: 'Write a short poem about autumn.',     output: 'Leaves of gold drift softly down, autumn wears a russet crown.', category: 'creative' },
    { input: 'What is 12 * 15?',                    output: '180',          category: 'math' },
    { input: 'Translate "Hello" to Spanish.',        output: 'Hola',        category: 'language' },
  ];

  const dataset = await prisma.dataset.create({
    data: {
      userId:      user.id,
      name:        'Demo Training Dataset',
      description: 'Sample dataset with diverse question-answer pairs for fine-tuning.',
      rows:        rows,
      rowCount:    rows.length,
    },
  });
  console.log(`Created Dataset "${dataset.name}" (id: ${dataset.id}) with ${dataset.rowCount} rows for user "${user.username}".`);
}

async function seedPromptRelease(prompts) {
  if (prompts.length === 0) {
    console.log('No prompts found — skipping PromptRelease seeding.');
    return;
  }

  const prompt = prompts[0];

  // Fetch the latest version for this prompt (required by schema)
  const version = await prisma.promptVersion.findFirst({
    where: { promptId: prompt.id },
    orderBy: { version: 'desc' },
  });

  if (!version) {
    console.log(`Prompt "${prompt.title}" has no versions — skipping PromptRelease seeding.`);
    return;
  }

  const release = await prisma.promptRelease.create({
    data: {
      promptId:    prompt.id,
      versionId:   version.id,
      environment: 'production',
      notes:       'Initial production release seeded by demo script.',
      createdBy:   prompt.authorId,
    },
  });
  console.log(`Created PromptRelease (id: ${release.id}) for prompt "${prompt.title}" at environment "${release.environment}".`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to database…');

  const [prompts, users] = await Promise.all([
    prisma.prompt.findMany({ take: 2, orderBy: { createdAt: 'asc' } }),
    prisma.user.findMany({   take: 1, orderBy: { createdAt: 'asc' } }),
  ]);

  console.log(`Found ${prompts.length} prompt(s) and ${users.length} user(s).`);
  console.log('');

  await seedEvalSuites(prompts);
  await seedBenchmarkSuites(prompts);
  await seedRagWorkspace(users);
  await seedDataset(users);
  await seedPromptRelease(prompts);

  console.log('');
  console.log('Seeding complete.');
}

main()
  .catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
