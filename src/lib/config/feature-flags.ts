export type RuntimeFeatureFlags = {
  adminDashboardEnabled: boolean;
  aiSummariesEnabled: boolean;
  summaryCronEnabled: boolean;
};

export type AdminFeatureFlag = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

const enabledValues = new Set(["1", "true", "yes", "on"]);
const disabledValues = new Set(["0", "false", "no", "off"]);

function readBooleanFlag(name: string, fallback: boolean): boolean {
  const rawValue = process.env[name]?.trim().toLowerCase();

  if (!rawValue) {
    return fallback;
  }

  if (enabledValues.has(rawValue)) {
    return true;
  }

  if (disabledValues.has(rawValue)) {
    return false;
  }

  return fallback;
}

export function getRuntimeFeatureFlags(): RuntimeFeatureFlags {
  return {
    adminDashboardEnabled: readBooleanFlag("ENABLE_ADMIN_DASHBOARD", true),
    aiSummariesEnabled: readBooleanFlag("ENABLE_AI_SUMMARIES", true),
    summaryCronEnabled: readBooleanFlag("ENABLE_SUMMARY_CRON", true),
  };
}

export function getAdminFeatureFlags(): AdminFeatureFlag[] {
  const flags = getRuntimeFeatureFlags();

  return [
    {
      key: "admin-dashboard",
      label: "Admin dashboard",
      description: "Controls whether the protected admin surface is available.",
      enabled: flags.adminDashboardEnabled,
    },
    {
      key: "ai-summaries",
      label: "AI summaries",
      description: "Controls summary generation in article writes and the batch route.",
      enabled: flags.aiSummariesEnabled,
    },
    {
      key: "summary-cron",
      label: "Summary cron",
      description: "Controls whether the scheduled summary route processes pending articles.",
      enabled: flags.summaryCronEnabled,
    },
  ];
}

export function isStackAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_STACK_PROJECT_ID &&
      process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY &&
      process.env.STACK_SECRET_SERVER_KEY,
  );
}