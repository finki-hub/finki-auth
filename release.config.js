export default {
  branches: [
    "main",
    { name: "dev", prerelease: "beta" }
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    [
      "@semantic-release/github",
      {
        successCommentCondition: false
      }
    ]
  ],
  ci: true
};
