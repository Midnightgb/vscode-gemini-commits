import * as vscode from 'vscode';

export interface GitExtension {
  getAPI(version: 1): GitAPI;
}

export interface GitAPI {
  repositories: Repository[];
}

export interface Repository {
  state: RepositoryState;
  diff(cached: boolean): Promise<string>;
  commit(message: string): Promise<void>;
  add(resources: vscode.Uri[]): Promise<void>;
  inputBox: SourceControlInputBox;
}

export interface SourceControlInputBox {
  value: string;
}

export interface RepositoryState {
  indexChanges: Change[];
  workingTreeChanges: Change[];
}

export interface Change {
  uri: vscode.Uri;
  status: number;
}

export function getGitExtension(): GitExtension | undefined {
  const vscodeGit = vscode.extensions.getExtension<GitExtension>('vscode.git');
  return vscodeGit?.exports;
}

export function getGitAPI(): GitAPI | undefined {
  const gitExtension = getGitExtension();
  return gitExtension?.getAPI(1);
}

export function getRepository(): Repository | undefined {
  const git = getGitAPI();
  if (!git || git.repositories.length === 0) {
    return undefined;
  }
  
  return git.repositories[0];
}

function getErrorMessage(error: any): string {
  if (!error) {
    return 'Unknown error';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }
  
  try {
    return JSON.stringify(error);
  } catch {
    return 'An error occurred';
  }
}

export async function stageAllChanges(): Promise<boolean> {
  try {
    // Use VSCode's built-in git.stageAll command instead of the API
    // This is more reliable and avoids the URI processing bug
    await vscode.commands.executeCommand('git.stageAll');
    console.log('All changes staged successfully using git.stageAll command');
    return true;
  } catch (error: any) {
    console.error('Error staging files with git.stageAll:', error);
    
    // Fallback: try using the Git API
    const repo = getRepository();
    if (!repo) {
      vscode.window.showErrorMessage('No Git repository found');
      return false;
    }

    try {
      const workingTreeChanges = repo.state.workingTreeChanges;
      if (workingTreeChanges.length === 0) {
        vscode.window.showInformationMessage('No changes to stage');
        return false;
      }

      // Stage all changes at once using an empty array (stages all)
      await repo.add([]);
      console.log('Files staged successfully using repo.add([])');
      return true;
    } catch (fallbackError: any) {
      console.error('Fallback staging also failed:', fallbackError);
      vscode.window.showErrorMessage('Failed to stage changes. Please stage your changes manually using the Source Control panel.');
      return false;
    }
  }
}

const DONT_ASK_STAGE_KEY = 'geminiCommits.dontAskToStage';

export async function resetAutoStagePreference(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(DONT_ASK_STAGE_KEY, false);
  vscode.window.showInformationMessage('Auto-stage preference has been reset. You will be asked again next time.');
}

export async function getStagedDiff(context: vscode.ExtensionContext): Promise<string | undefined> {
  const repo = getRepository();
  if (!repo) {
    vscode.window.showErrorMessage('No Git repository found');
    return undefined;
  }

  const stagedChanges = repo.state.indexChanges;
  const workingTreeChanges = repo.state.workingTreeChanges;
  
  if (stagedChanges.length === 0) {
    // Check if user doesn't want to be asked
    const dontAsk = context.globalState.get<boolean>(DONT_ASK_STAGE_KEY, false);
    
    if (dontAsk) {
      // Auto-stage all changes
      if (workingTreeChanges.length === 0) {
        vscode.window.showWarningMessage('No changes found to stage or commit');
        return undefined;
      }
      
      const staged = await stageAllChanges();
      if (!staged) {
        return undefined;
      }
    } else {
      // Ask user what to do
      if (workingTreeChanges.length === 0) {
        vscode.window.showWarningMessage('No changes found to stage or commit');
        return undefined;
      }

      const choice = await vscode.window.showInformationMessage(
        'No staged changes found. Would you like to stage all your changes and generate a commit?',
        {
          modal: true,
        },
        'Yes',
        'Yes, don\'t ask again',
      );
      
      if (!choice) {
        return undefined;
      }

      if (choice === 'Yes, don\'t ask again') {
        await context.globalState.update(DONT_ASK_STAGE_KEY, true);
      }

      const staged = await stageAllChanges();
      if (!staged) {
        return undefined;
      }
    }
  }

  try {
    const diff = await repo.diff(true);
    return diff;
  } catch (error: any) {
    console.error('Error getting git diff:', error);
    vscode.window.showErrorMessage('Failed to get git diff. Please check the console for details.');
    return undefined;
  }
}

export function setCommitMessage(message: string): boolean {
  const repo = getRepository();
  if (!repo) {
    vscode.window.showErrorMessage('No Git repository found');
    return false;
  }

  try {
    repo.inputBox.value = message;
    return true;
  } catch (error: any) {
    console.error('Error setting commit message:', error);
    vscode.window.showErrorMessage('Failed to set commit message.');
    return false;
  }
}

export async function commitChanges(message: string): Promise<boolean> {
  const repo = getRepository();
  if (!repo) {
    vscode.window.showErrorMessage('No Git repository found');
    return false;
  }

  try {
    await repo.commit(message);
    vscode.window.showInformationMessage('✅ Commit created successfully!');
    return true;
  } catch (error: any) {
    console.error('Error committing:', error);
    vscode.window.showErrorMessage('Failed to commit. Please check the console for details or commit manually.');
    return false;
  }
}

