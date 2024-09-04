module.exports = {
  branches: 'main',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/npm',
      // Skip token verification if NPM_TOKEN isn't defined
      // This is because dependabot PRs do not have access to this token, but don't need it
      // In actual releases, the token will be verified.
      { verifyConditions: process.env.NPM_TOKEN ? '@semantic-release/npm' : false },
    ],
    '@semantic-release/github',
    '@semantic-release/git',
  ],
};
