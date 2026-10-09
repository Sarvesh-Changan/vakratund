import {
  loadStandaloneEnv,
  printEnvironmentLoadError,
  printValidationFailure,
  validateStandaloneEnvironment,
} from "../src/lib/standalone-env.ts";

try {
  const loaded = loadStandaloneEnv();
  const result = validateStandaloneEnvironment(loaded.environment);
  if (!result.success) {
    printValidationFailure(result.error);
    process.exitCode = 1;
  } else {
    for (const name of ["BETTER_AUTH_SECRET", "IP_HASH_SECRET"] as const)
      console.log(`${name}: OK`);
    process.exitCode = 0;
  }
} catch (error) {
  printEnvironmentLoadError(error);
  process.exitCode = 1;
}
