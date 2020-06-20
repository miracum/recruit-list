import FHIR from "fhirclient";
import fhirpath from "fhirpath";
import Constants from "@/const";
import Vue from "vue";

function createFhirClient() {
  let fhirUrl = process.env.VUE_APP_FHIR_URL;
  if (!fhirUrl) {
    // this is an awkward workaround for FHIR.client not accepting relative paths as valid URLs
    fhirUrl = `${window.location.protocol}//${window.location.host}/fhir`;
  }

  return FHIR.client({ serverUrl: fhirUrl });
}

const actions = {
  getFhirClient() {
    return createFhirClient();
  },
  async fetchLists() {
    const client = createFhirClient();

    const screeningLists = await client.request(
      `List/?code=${Constants.SYSTEM_SCREENING_LIST}|screening-recommendations`,
      {
        resolveReferences: ["extension.0.valueReference", ""],
        flat: true,
        pageLimit: 0,
      }
    );

    if (screeningLists.length !== 0) {
      return screeningLists;
    }
    return [];
  },
  async fetchListById(id) {
    const client = createFhirClient();

    const allResources = await client.request(`List/?_id=${id}&_include=List:item`, {
      resolveReferences: ["extension.0.valueReference", "individual", "study"],
      flat: true,
    });

    if (allResources.length === 0) {
      return {};
    }

    const list = fhirpath.evaluate(allResources, "List")[0];

    if (list.entry) {
      // a manual "resolveReferences" implementation since fhir.js doesn't support
      // reference resolution on arrays, ie. the List.entry field.
      // see https://github.com/smart-on-fhir/client-js/issues/73
      list.entry = list.entry.map((entry) => {
        const r = fhirpath.evaluate(allResources, "ResearchSubject.where(id=%subjectId)", {
          subjectId: entry.item.reference.split("/")[1],
        })[0];
        return { item: r };
      });
    }

    return list;
  },
  async fetchSubjectHistory(subjectId) {
    const client = createFhirClient();
    const subjectHistory = await client.request(`ResearchSubject/${subjectId}/_history`, {
      flat: true,
      pageLimit: 0,
      resolveReferences: ["individual"],
    });

    return subjectHistory;
  },
  async fetchPatientRecord(patientId) {
    const client = createFhirClient();
    const record = await client.request(
      `Patient/${patientId}/$everything?_count=250&_pretty=false`,
      {
        flat: true,
        pageLimit: 0,
      }
    );

    return record;
  },
  async fetchLatestEncounterWithLocation(patientId) {
    const client = createFhirClient();

    // fetch the all Encounters for the given patient, sorted by modification date
    // and include the Encounter's location to reduce the number of server round-trips
    const entries = await client.request(
      `Encounter?subject=Patient/${patientId}&_sort=-date&_count=50&_include=Encounter:location&_pretty=false`,
      {
        flat: true,
        pageLimit: 0,
      }
    );

    // unfortunately, resolveReferences to directly replace the encounter.location.reference
    // withe the actual Location resource doesn't work. So we need to build a manual
    // lookup from Location.id to the Location object.
    const locations = entries.filter((entry) => entry.resourceType === "Location");
    const locationLookup = new Map(
      locations.map((location) => [`Location/${location.id}`, location])
    );

    // filter out the encounters so we only need to iterate over them
    const encounters = entries.filter((entry) => entry.resourceType === "Encounter");

    for (let i = 0; i < encounters.length; i += 1) {
      const encounter = encounters[i];

      // if there's a location associated with the encounter then that's already a good sign
      if (encounter.location) {
        Vue.$log.debug(
          `Found Encounter ${encounter.id} with location containing ${encounter.location.length} entries`
        );

        for (let k = 0; k < encounter.location.length; k += 1) {
          const locationEntry = encounter.location[k];
          const locationReference = locationEntry.location.reference;

          // we currently only handle encounters that explicitely reference a defined Location
          // resource and not yet logical references
          if (locationReference) {
            // get the actual Location resource via the lookup call
            const location = locationLookup.get(locationReference);

            Vue.$log.debug(
              `Found Encounter referencing a location with status ${locationEntry.status}`
            );

            // we only return locations that have a telecom set
            if (location.telecom) {
              Vue.$log.debug("Found encounter with telecom set");
              return { encounter, location };
            }
          }
        }
      }
    }

    return null;
  },
};

export default actions;