export default {
  SYSTEM_SUBJECT_IDENTIFIER: "http://ohdsi.org/omop/fhir/subject-identifier",
  SYSTEM_STUDY_ACRONYM: "https://fhir.miracum.org/uc1/StructureDefinition/StudyAcronym",
  SYSTEM_SCREENING_LIST: "https://fhir.miracum.org/uc1/CodeSystem/ScreeningList",
  URL_NOTE_EXTENSION: "https://fhir.miracum.org/uc1/StructureDefinition/ResearchSubjectNote",
  STATUS_TRANSLATION: {
    candidate: "Rekrutierungsvorschlag",
    screening: "Wird geprüft",
    eligible: "Erfüllt E/A-Kriterien",
    ineligible: "E/A-Kriterien nicht erfüllt",
    "on-study": "Wurde eingeschlossen",
    withdrawn: "Nicht gewillt teilzunehmen",
  },
};
