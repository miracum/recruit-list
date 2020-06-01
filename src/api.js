import FHIR from "fhirclient";
import fhirpath from "fhirpath";
import Constants from "@/const";

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
        // let newEntry = entry;
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
};

export default actions;
