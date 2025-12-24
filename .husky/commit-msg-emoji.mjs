import { readFileSync, writeFileSync } from 'fs';

const typeToEmojiMap = {
  init: '🎉',
  feat: '✨',
  chore: '🔥',
  fix: '🐛',
  style: '🎨',
  pref: '⚡️',
  docs: '📝',
  build: '🚀',
  test: '✅',
  release: '🔖',
  wip: '🚧',
  revert: '⏪️',
  refactor: '♻️',
  merge: '🔀',
  ci: '👷',
  perf: '⚡️',
  security: '🔒',
  comment: '💡',
  begin: '🎉',
};

const COMMIT_EDITING_FILEPATH = process.argv.at(-1);

const inputMsg = readFileSync(COMMIT_EDITING_FILEPATH, 'utf8');

writeFileSync(
  COMMIT_EDITING_FILEPATH,
  transform(inputMsg, typeToEmojiMap),
  'utf8'
);

function transform(inputMsg, typeToEmojiMap) {
  const [type, emoji] =
    Object.entries(typeToEmojiMap).find(([type]) =>
      inputMsg.startsWith(type)
    ) ?? [];

  if (type) {
    return inputMsg.replace(new RegExp(`^${type}`), `$&${emoji} `);
  }

  throw new Error('Invalid type');
}
