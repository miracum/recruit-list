const logger = require("pino")({ level: process.env.LOG_LEVEL || "info" });

const URL_LIST_BELONGS_TO_STUDY_EXTENSION =
  "https://fhir.miracum.org/uc1/StructureDefinition/belongsToStudy";

const getAccessibleStudyAcronymsForUser = (user, trialsConfig) => {
  const accessibleStudyAcronyms = [];

  if (!user.preferred_username && !user.email) {
    logger.warn("either username and/or email aren't set for the user. Denying all access.");
    return [];
  }

  trialsConfig.forEach((trial) => {
    // Check if the current user's username or email is part of the accessibleBy
    // configuration. accessibleBy.users could contain either usernames or emails of
    // allowed users.
    if (
      trial.accessibleBy?.users?.includes(user.preferred_username) ||
      trial.accessibleBy?.users?.includes(user.email)
    ) {
      accessibleStudyAcronyms.push(trial.acronym);
      return;
    }

    // Check if a subscription to receive notifications exists for the current user.
    // Every user that is configured to receive email notifications is allowed to access the
    // screening list.
    if (trial.subscriptions?.map((subscription) => subscription.email).includes(user.email)) {
      accessibleStudyAcronyms.push(trial.acronym);
    }
  });

  logger
    .child({ username: user.preferred_username, accessibleStudyAcronyms })
    .debug("User can access these studies");

  return accessibleStudyAcronyms;
};

const userHasAdminRole = (user, authConfig) => {
  if (!user.resource_access) {
    return false;
  }
  const roles = user?.resource_access[authConfig?.clientId]?.roles;
  return roles.includes("admin");
};

exports.createAccessFilter = (trialsConfig, authConfig) => (resource, user) => {
  if (userHasAdminRole(user, authConfig)) {
    return resource;
  }

  const accessibleStudyAcronyms = getAccessibleStudyAcronymsForUser(user, trialsConfig);

  const handleBundle = (bundle) => {
    const entriesToKeep = bundle.entry.filter((entry) => {
      if (entry.resource.resourceType === "List") {
        const belongsToStudyExtension = entry.resource.extension?.filter(
          (extension) => extension.url === URL_LIST_BELONGS_TO_STUDY_EXTENSION
        )[0];
        const belongsToStudyAcronym = belongsToStudyExtension?.valueReference.display;
        if (!belongsToStudyAcronym) {
          logger
            .child({ fullUrl: entry.fullUrl })
            .error(
              "The List resource does not contain a reference to the study acronym. " +
                "Denying access by default."
            );
          return false;
        }
        if (
          accessibleStudyAcronyms.includes("*") ||
          accessibleStudyAcronyms.includes(belongsToStudyAcronym)
        ) {
          return true;
        }

        return false;
      }
      // Filtering is currently only applied to the List resources. All others are passed through.
      // A more thorough solution should filter out all resources referenced by Lists that aren't accessible
      // as well.
      return true;
    });

    // copies/clones the bundle
    const modifiedBundle = { ...bundle };
    modifiedBundle.entry = entriesToKeep;
    modifiedBundle.total = entriesToKeep.length;
    return modifiedBundle;
  };

  if (resource.resourceType === "Bundle") {
    return handleBundle(resource);
  }

  return resource;
};
