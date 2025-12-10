import { GoogleGenerativeAI } from '@google/generative-ai';
import { Config } from './config';

/**
 * Interface for Gemini model information
 */
export interface GeminiModel {
  name: string;
  displayName: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

/**
 * Lists all available Gemini models from the API
 * @param apiKey - Gemini API key
 * @returns Array of available models
 */
export async function listAvailableModels(apiKey: string): Promise<GeminiModel[]> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // The SDK doesn't have a direct listModels method exposed,
    // so we'll use a fetch request to the REST API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as { models?: any[] };
    const models = data.models || [];
    
    // Patterns to exclude specialized models that aren't suitable for text generation
    const excludePatterns = [
      'embedding',        // Embedding models
      'imagen',           // Image generation
      'veo',              // Video generation
      '-tts',             // Text-to-speech
      '-image-',          // Image generation variants
      'native-audio',     // Native audio models
      'robotics',         // Robotics-specific models
      'computer-use',     // Computer use models
      'aqa',              // Attributed Question Answering
    ];
    
    // Filter only text generative models suitable for commit messages
    return models
      .filter((model: any) => {
        // Must support generateContent
        if (!model.supportedGenerationMethods?.includes('generateContent')) {
          return false;
        }
        
        const modelName = model.name.toLowerCase();
        
        // Exclude specialized models
        if (excludePatterns.some(pattern => modelName.includes(pattern))) {
          return false;
        }
        
        // Include only Gemini and Gemma models
        return modelName.includes('gemini') || modelName.includes('gemma');
      })
      .map((model: any) => ({
        name: model.name.replace('models/', ''),
        displayName: model.displayName || model.name,
        description: model.description,
        supportedGenerationMethods: model.supportedGenerationMethods
      }))
      .sort((a, b) => {
        // Sort by name to have a predictable order
        return a.name.localeCompare(b.name);
      });
  } catch (error: any) {
    console.error('Failed to list models:', error);
    throw new Error(`Failed to list models: ${error?.message || error}`);
  }
}

/**
 * Gets the best available model (prefers latest version)
 * @param apiKey - Gemini API key
 * @returns Model name to use
 */
export async function getBestAvailableModel(apiKey: string): Promise<string> {
  try {
    const models = await listAvailableModels(apiKey);
    
    if (models.length === 0) {
      throw new Error('No models available');
    }
    
    // Priority order based on actual available models (as of Dec 2025)
    // Prefer stable releases over experimental/preview versions
    // Prefer flash models (faster, cheaper) for commit messages
    const priorityModels = [
      // Latest aliases (always point to newest stable) - BEST CHOICE
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-pro-latest',
      
      // Stable Gemini 2.5 models (best quality, latest)
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
      
      // Stable Gemini 2.0 models
      'gemini-2.0-flash-001',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite-001',
      'gemini-2.0-flash-lite',
      
      // Experimental models
      'gemini-2.0-flash-exp',
      'gemini-exp-1206',
      
      // Gemini 3 preview
      'gemini-3-pro-preview',
      
      // Gemma models (smaller, open-source)
      'gemma-3-27b-it',
      'gemma-3-12b-it',
      'gemma-3-4b-it',
      'gemma-3-1b-it',
    ];
    
    for (const preferredModel of priorityModels) {
      const found = models.find(m => m.name === preferredModel);
      if (found) {
        return found.name;
      }
    }
    
    // If no priority model found, return the first available
    return models[0].name;
  } catch (error) {
    // Fallback to a common stable model name
    console.warn('Could not get best model, using fallback');
    return 'gemini-flash-latest';
  }
}

/**
 * Gets the exact token count from Gemini API
 * Uses the official countTokens API for accurate token counting (free, no charge)
 * @param apiKey - Gemini API key
 * @param text - Text content to count tokens for
 * @param model - Model name (default: gemini-flash-latest)
 * @returns Exact token count from Gemini's tokenizer
 */
export async function countTokens(
  apiKey: string,
  text: string,
  model: string = 'gemini-flash-latest'
): Promise<number> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    const result = await geminiModel.countTokens(text);
    return result.totalTokens;
  } catch (error: any) {
    // If countTokens fails, fall back to estimation
    const errorMessage = error?.message || String(error);
    console.warn('⚠️ Failed to count tokens via API, using estimation instead.');
    console.warn('Reason:', errorMessage);
    
    // Still fall back to estimation but log detailed info
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('PERMISSION_DENIED')) {
      console.error('❌ API Key issue detected during token counting:', errorMessage);
    }
    
    return estimateTokens(text);
  }
}

/**
 * Estimates the number of tokens in a text (fallback method)
 * Based on Gemini's official guideline: 1 token ≈ 4 characters for plain text
 * For code/diffs, we use a more conservative 2.5 chars/token to account for:
 * - Special characters (each is often a separate token)
 * - Code syntax and punctuation
 * - Git diff formatting (+, -, @@, etc.)
 */
export function estimateTokens(text: string): number {
  // Conservative estimation for technical content
  // Using 2.5 chars per token (vs. 4 chars for plain text)
  return Math.ceil(text.length / 2.5);
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
  let modelToUse = config.model;
  let triedFallback = false;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelToUse });

    const prompt = buildPrompt(diff, config.language);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    
    return text.replace(/^["']|["']$/g, '');
  } catch (error: any) {
    // Log full error for debugging
    console.error('Gemini API Error:', error);
    
    // Extract detailed error information
    const errorMessage = error?.message || String(error);
    const errorStatus = error?.status || error?.response?.status;
    const errorDetails = error?.response?.error?.message || error?.details;

    // Check for specific error patterns
    if (errorMessage.includes('API_KEY_INVALID') || errorStatus === 400) {
      throw new Error(`❌ Invalid API Key: ${errorMessage}\n\nVerify your API key in Google AI Studio.`);
    } 
    
    if (errorMessage.includes('PERMISSION_DENIED') || errorStatus === 403) {
      throw new Error(`❌ Permission denied: ${errorMessage}\n\nDoes your API key have permissions to use the model ${modelToUse}?`);
    }
    
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota') || errorStatus === 429) {
      throw new Error(`❌ Límite excedido: ${errorMessage}\n\nEsto puede ser:\n- Límite de RPM (requests por minuto)\n- Límite de TPM (tokens por minuto)\n- Límite diario excedido\n\nRevisa tu uso en: https://aistudio.google.com/app/apikey`);
    }
    
    // If model not found, try to use the best available model
    if ((errorMessage.includes('MODEL_NOT_FOUND') || errorStatus === 404) && !triedFallback) {
      console.warn(`Model ${modelToUse} not found, trying to get best available model...`);
      
      try {
        const bestModel = await getBestAvailableModel(apiKey);
        console.log(`Retrying with model: ${bestModel}`);
        
        // Retry with the best available model
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: bestModel });
        const prompt = buildPrompt(diff, config.language);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();
        
        // Show a warning about model change
        console.warn(`✓ Used alternative model: ${bestModel} (configured: ${modelToUse})`);
        
        return text.replace(/^["']|["']$/g, '');
      } catch (fallbackError: any) {
        throw new Error(`❌ Model not found: "${modelToUse}"\n\nTried using an alternative model but also failed.\n\nUse the "Gemini Commits: Select Model" command to choose an available model.`);
      }
    }

    if (errorMessage.includes('INVALID_ARGUMENT') || errorStatus === 400) {
      throw new Error(`❌ Invalid argument: ${errorMessage}\n\n${errorDetails || 'Check the model configuration and parameters.'}`);
    }

    // Network or connection errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      throw new Error(`❌ Connection error: ${errorMessage}\n\nCheck your internet connection.`);
    }

    // Generic error with full details
    throw new Error(`❌ Error generating commit:\n\nMessage: ${errorMessage}\n${errorStatus ? `Status: ${errorStatus}\n` : ''}${errorDetails ? `Details: ${errorDetails}` : ''}`);
  }
}

