import * as vscode from 'vscode';

const API_KEY_SECRET = 'geminiCommits.apiKey';

export interface Config {
  language: 'en' | 'es';
  model: string;
  tokenLimit: number;
}

export async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  return await context.secrets.get(API_KEY_SECRET);
}

export async function setApiKey(context: vscode.ExtensionContext, apiKey: string): Promise<void> {
  await context.secrets.store(API_KEY_SECRET, apiKey);
}

export async function clearApiKey(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(API_KEY_SECRET);
}

export function getConfig(): Config {
  const config = vscode.workspace.getConfiguration('geminiCommits');
  return {
    language: config.get<'en' | 'es'>('language', 'en'),
    model: config.get<string>('model', 'gemini-flash-latest'),
    tokenLimit: config.get<number>('tokenLimit', 20000)
  };
}

export async function setModel(modelName: string): Promise<void> {
  const config = vscode.workspace.getConfiguration('geminiCommits');
  await config.update('model', modelName, vscode.ConfigurationTarget.Global);
}

export async function promptForApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const apiKey = await vscode.window.showInputBox({
    prompt: 'Enter your Gemini API Key',
    password: true,
    placeHolder: 'AIza...',
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return 'API key cannot be empty';
      }
      return null;
    }
  });

  if (apiKey) {
    await setApiKey(context, apiKey);
    vscode.window.showInformationMessage('Gemini API key saved successfully!');
  }

  return apiKey;
}

