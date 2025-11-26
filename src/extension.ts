import * as vscode from 'vscode';
import { getApiKey, promptForApiKey, getConfig } from './config';
import { getStagedDiff, setCommitMessage, resetAutoStagePreference } from './git';
import { generateCommitMessage, countTokens, buildPrompt } from './gemini';

export function activate(context: vscode.ExtensionContext) {
  console.log('Gemini Commits extension is now active');

  const generateCommitCommand = vscode.commands.registerCommand(
    'gemini-commits.generateCommit',
    async () => {
      await handleGenerateCommit(context);
    }
  );

  const setApiKeyCommand = vscode.commands.registerCommand(
    'gemini-commits.setApiKey',
    async () => {
      await promptForApiKey(context);
    }
  );

  const resetAutoStageCommand = vscode.commands.registerCommand(
    'gemini-commits.resetAutoStage',
    async () => {
      await resetAutoStagePreference(context);
    }
  );

  context.subscriptions.push(generateCommitCommand, setApiKeyCommand, resetAutoStageCommand);
}

async function handleGenerateCommit(context: vscode.ExtensionContext) {
  try {
    let apiKey = await getApiKey(context);
    
    if (!apiKey) {
      const choice = await vscode.window.showInformationMessage(
        'Gemini API key not found. Would you like to set it now?',
        'Yes',
        'No'
      );
      
      if (choice !== 'Yes') {
        return;
      }
      
      apiKey = await promptForApiKey(context);
      if (!apiKey) {
        return;
      }
    }

    const diff = await getStagedDiff(context);
    if (!diff) {
      return;
    }

    // Check token usage before generating
    const config = getConfig();
    const prompt = buildPrompt(diff, config.language);

    // Get exact token count from Gemini API (free, accurate)
    const tokenCount = await countTokens(apiKey, prompt, config.model);

    if (tokenCount > config.tokenLimit) {
      const choice = await vscode.window.showWarningMessage(
        `This request will use ${tokenCount.toLocaleString()} tokens, which exceeds the configured ${config.tokenLimit.toLocaleString()} token threshold for large prompts.\n\nDo you want to continue?`,
        { modal: true },
        'Continue',
        'Change Threshold',
      );

      if (!choice) {
        return;
      }

      if (choice === 'Change Threshold') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'geminiCommits.tokenLimit');
        return;
      }
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating commit message with Gemini...',
        cancellable: false
      },
      async () => {
        try {
          const commitMessage = await generateCommitMessage(apiKey!, diff, config);
          
          if (!commitMessage) {
            vscode.window.showErrorMessage('Failed to generate commit message');
            return;
          }

          // Set the commit message directly in the Source Control input box
          const success = setCommitMessage(commitMessage);
          
          if (success) {
            vscode.window.showInformationMessage(
              '✨ Commit message generated! Review it in the Source Control panel and commit when ready.',
              'Open Source Control'
            ).then(choice => {
              if (choice === 'Open Source Control') {
                vscode.commands.executeCommand('workbench.view.scm');
              }
            });
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(error.message || 'Failed to generate commit message');
        }
      }
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message || 'An unexpected error occurred');
  }
}

export function deactivate() {}

