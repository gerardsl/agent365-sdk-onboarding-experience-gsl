import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import work from './lib/local-work.cjs';

export function main(argv, { log = console.log, error = console.error, ...options } = {}) {
  const args = argv.filter(arg => arg !== '--force');
  const force = argv.includes('--force');
  if (!args.length || (args.length === 1 && ['--help', '-h'].includes(args[0]))) {
    log('Usage: node .a365-kit/local-work.mjs status|record|timings|clear\n' +
      '       node .a365-kit/local-work.mjs run <profile> [--force]\n' +
      `Profiles: ${Object.keys(work.PROFILES).join(', ')}\n` +
      'Run from the agent workspace. status/record concern local detection only, never tenant readiness.\n' +
      'run executes the selected restore/compiler command unless an unchanged successful result is reusable.\n' +
      'Custom builds and uncertain inputs run normally. --force, A365_LOCAL_WORK_FORCE=1 and CI force fresh execution.\n' +
      'Local receipts and the last 100 timing events are kept in the current user cache, outside the project.\n' +
      'record is only for freshly detected, confirmed local metadata; clear removes this workspace\'s receipts.');
    return 0;
  }
  if (args[0] === 'run' && args.length === 2) {
    const result = work.run(args[1], { ...options, force });
    if (result.output) log(result.output);
    if (result.reused) log(`Reused successful ${result.profile} for unchanged local inputs and artifacts.`);
    return result.ok ? 0 : 1;
  }
  if (args.length !== 1 || !['status', 'record', 'timings', 'clear'].includes(args[0])) {
    error('Use status, record, timings, clear, or run <profile>. See --help.');
    return 2;
  }
  if (args[0] === 'timings') log(JSON.stringify(work.timings(options), null, 2));
  else if (args[0] === 'clear') {
    work.clear(options);
    log('Removed this workspace\'s local receipts and timing history. Agent and tenant configuration were not changed.');
  } else log(JSON.stringify(work.detection(args[0], { ...options, force }), null, 2));
  return 0;
}

if (process.argv[1] && fs.existsSync(process.argv[1]) &&
    import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (error) {
    console.error(`Local work failed: ${error.message}`);
    process.exitCode = 1;
  }
}
