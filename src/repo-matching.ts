/**
 * Pure repository matching logic — no vscode dependency, fully testable.
 */

export interface RepositoryLike {
  rootUri: { toString(): string };
}

export interface SourceControlLike {
  rootUri?: { toString(): string };
}

/**
 * Given a list of repositories and an optional SourceControl context,
 * returns the matching repository or undefined.
 *
 * When sourceControl is provided (e.g. from an scm/title button click),
 * the repository whose rootUri matches is returned.
 * Otherwise, if there is exactly one repository it is returned as a
 * convenience fallback.  When multiple repositories exist and no match
 * can be made the caller is expected to prompt the user.
 */
export function matchRepository<T extends RepositoryLike>(
  repositories: T[],
  sourceControl?: SourceControlLike,
): T | undefined {
  if (repositories.length === 0) {
    return undefined;
  }

  // If sourceControl provided (from scm/title click), match by rootUri
  if (sourceControl?.rootUri) {
    const match = repositories.find(
      repo => repo.rootUri.toString() === sourceControl.rootUri!.toString(),
    );
    if (match) {
      return match;
    }
  }

  // Fallback: single repo -> use it; multiple -> return undefined (caller handles)
  if (repositories.length === 1) {
    return repositories[0];
  }

  return undefined;
}
