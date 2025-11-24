import { GoogleGenerativeAI } from '@google/generative-ai';
import { Config } from './config';

/**
 * Estimates the number of tokens in a text
 * Rough estimation: 1 token ≈ 4 characters (for English/Spanish)
 */
export function estimateTokens(text: string): number {
  // More accurate estimation considering words and punctuation
  const chars = text.length;
  const words = text.split(/\s+/).length;
  
  // Average between character-based and word-based estimation
  const charBasedEstimate = chars / 4;
  const wordBasedEstimate = words * 1.3; // Most words are 1-2 tokens
  
  return Math.ceil((charBasedEstimate + wordBasedEstimate) / 2);
}

const CONVENTIONAL_COMMITS_RULES = `
You are an expert in generating concise, professional conventional commit messages following the Conventional Commits 1.0.0 specification.

## Commit Message Format
<type>[optional scope]: <short description>

[blank line]

<1-2 sentence summary>

[blank line if needed]

- <key change 1>
- <key change 2>
- <key change 3>

## Commit Types
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- perf: Performance improvement
- test: Tests
- chore: Maintenance
- build: Build system
- ci: CI/CD

## Rules
1. Subject line: imperative mood, lowercase, under 72 chars, no period
2. Body summary: 1-2 concise sentences max, wrap at 72 chars
3. Bullets: Direct and specific, no redundant explanations
4. Keep it SHORT and focused on WHAT changed

## Good Examples

feat(layout): add accessibility menu and standardize footer

Integrates the new \`@ape/accessibility\` package and adds the
\`AccessibilityMenu\` to \`MainLayout\`, improving usability for a wider
audience.

Also standardizes the footer by replacing the inline <footer> with the
reusable \`Footer\` component from \`@ape/layout\`.

- Adds dependency \`@ape/accessibility\`
- Updates \`tsconfig.json\` references
- Renders \`AccessibilityMenu\` in \`MainLayout\`
- Replaces custom footer with shared \`Footer\`

---

fix(api): resolve connection pool exhaustion

Fixes 500 errors during peak traffic by increasing pool limits.

- Increases connection pool size from 10 to 50
- Adds retry logic with exponential backoff
- Implements proper connection cleanup

---

refactor(components): consolidate button variants

Simplifies button API by merging variants into single component.

- Merges Primary, Secondary, Tertiary into one component
- Replaces individual components with variant prop
- Updates usage across application
`;

export function buildPrompt(diff: string, language: 'en' | 'es'): string {
  const languageInstruction = language === 'es'
    ? '\n\nIMPORTANT: Generate the commit message in SPANISH.'
    : '\n\nIMPORTANT: Generate the commit message in ENGLISH.';

  return `${CONVENTIONAL_COMMITS_RULES}${languageInstruction}

Analyze the following git diff and generate a CONCISE conventional commit message:

\`\`\`diff
${diff}
\`\`\`

Generate a commit message with:
1. Subject line: type(scope): short description
2. Blank line
3. Brief summary: 1-2 sentences max, wrapped at 72 characters
4. Blank line (optional, only if you add bullets)
5. Bullet list: Key changes only, direct and specific

IMPORTANT: Be CONCISE. Avoid verbose explanations, redundant phrases, and long paragraphs. 
Focus on WHAT changed, not lengthy WHY explanations.

Generate ONLY the commit message. No markdown formatting, code blocks, quotes, or commentary.`;
}

export async function generateCommitMessage(
  apiKey: string,
  diff: string,
  config: Config
): Promise<string | undefined> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: config.model });

    const prompt = buildPrompt(diff, config.language);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    
    return text.replace(/^["']|["']$/g, '');
  } catch (error: any) {
    if (error?.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your API key and try again.');
    } else if (error?.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your usage limits.');
    } else {
      throw new Error(`Failed to generate commit message: ${error?.message || error}`);
    }
  }
}

