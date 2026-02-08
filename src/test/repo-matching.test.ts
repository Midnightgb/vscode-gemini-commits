import { expect } from 'chai';
import { matchRepository, RepositoryLike, SourceControlLike } from '../repo-matching';

// ---------------------------------------------------------------------------
// Helpers — lightweight stubs that satisfy the interfaces
// ---------------------------------------------------------------------------

function makeRepo(uri: string): RepositoryLike {
  return { rootUri: { toString: () => uri } };
}

function makeSC(uri?: string): SourceControlLike | undefined {
  if (uri === undefined) {
    return undefined;
  }
  return { rootUri: { toString: () => uri } };
}

// ---------------------------------------------------------------------------
// matchRepository()
// ---------------------------------------------------------------------------

describe('matchRepository', () => {
  // ---- empty repos array ----

  it('should return undefined when repositories array is empty', () => {
    expect(matchRepository([], makeSC('/repo-a'))).to.be.undefined;
  });

  it('should return undefined when repositories array is empty and no sourceControl', () => {
    expect(matchRepository([])).to.be.undefined;
  });

  // ---- single repo ----

  it('should return the single repo when sourceControl is undefined', () => {
    const repo = makeRepo('/repo-a');
    expect(matchRepository([repo])).to.equal(repo);
  });

  it('should return the single repo when sourceControl has no rootUri', () => {
    const repo = makeRepo('/repo-a');
    expect(matchRepository([repo], {})).to.equal(repo);
  });

  it('should return the single repo when sourceControl matches it', () => {
    const repo = makeRepo('/repo-a');
    expect(matchRepository([repo], makeSC('/repo-a'))).to.equal(repo);
  });

  it('should return the single repo even when sourceControl does not match', () => {
    const repo = makeRepo('/repo-a');
    // No match by rootUri, but only one repo → fallback
    expect(matchRepository([repo], makeSC('/repo-b'))).to.equal(repo);
  });

  // ---- multiple repos, with sourceControl ----

  it('should return the matching repo when sourceControl matches the first repo', () => {
    const repoA = makeRepo('/repo-a');
    const repoB = makeRepo('/repo-b');
    expect(matchRepository([repoA, repoB], makeSC('/repo-a'))).to.equal(repoA);
  });

  it('should return the matching repo when sourceControl matches the second repo', () => {
    const repoA = makeRepo('/repo-a');
    const repoB = makeRepo('/repo-b');
    expect(matchRepository([repoA, repoB], makeSC('/repo-b'))).to.equal(repoB);
  });

  it('should return the matching repo from many repositories', () => {
    const repos = [makeRepo('/a'), makeRepo('/b'), makeRepo('/c'), makeRepo('/d')];
    expect(matchRepository(repos, makeSC('/c'))).to.equal(repos[2]);
  });

  // ---- multiple repos, without sourceControl ----

  it('should return undefined when multiple repos and sourceControl is undefined', () => {
    const repoA = makeRepo('/repo-a');
    const repoB = makeRepo('/repo-b');
    expect(matchRepository([repoA, repoB])).to.be.undefined;
  });

  it('should return undefined when multiple repos and sourceControl has no rootUri', () => {
    const repoA = makeRepo('/repo-a');
    const repoB = makeRepo('/repo-b');
    expect(matchRepository([repoA, repoB], {})).to.be.undefined;
  });

  it('should return undefined when multiple repos and sourceControl matches none', () => {
    const repoA = makeRepo('/repo-a');
    const repoB = makeRepo('/repo-b');
    expect(matchRepository([repoA, repoB], makeSC('/repo-c'))).to.be.undefined;
  });

  // ---- generic type preservation ----

  it('should preserve the concrete type of the returned repository', () => {
    interface MyRepo extends RepositoryLike {
      name: string;
    }
    const repo: MyRepo = { rootUri: { toString: () => '/x' }, name: 'my-repo' };
    const result = matchRepository<MyRepo>([repo], makeSC('/x'));
    expect(result).to.not.be.undefined;
    expect(result!.name).to.equal('my-repo');
  });

  // ---- URI comparison edge cases ----

  it('should compare rootUri using toString(), not reference equality', () => {
    // Two different objects that stringify to the same value
    const repo = { rootUri: { toString: () => 'file:///workspace/repo' } };
    const sc = { rootUri: { toString: () => 'file:///workspace/repo' } };
    expect(matchRepository([repo], sc)).to.equal(repo);
  });

  it('should not match when URIs differ only in trailing slash', () => {
    const repo = makeRepo('file:///workspace/repo');
    expect(matchRepository([repo, makeRepo('/other')], makeSC('file:///workspace/repo/'))).to.be.undefined;
  });
});
