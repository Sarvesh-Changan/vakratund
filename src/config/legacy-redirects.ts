export type LegacyRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

// TODO(client): provide the complete list of old website URLs and their approved destinations.
export const legacyRedirects: LegacyRedirect[] = [];
