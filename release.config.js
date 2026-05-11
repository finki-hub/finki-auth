const config = {
  branches: ['main', { name: 'dev', prerelease: 'beta' }],
  ci: true,
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        successCommentCondition: false,
      },
    ],
  ],
};

export default config;
