// https://docs.cypress.io/api/introduction/api.html
import oidcConfig from "../fixtures/keycloak";

const patientRequestUrl = "**/Patient/**";

describe("PatientRecord", () => {
  beforeEach(() => {
    cy.login(oidcConfig);
  });
  context("after loading lists from server", () => {
    beforeEach(() => {
      cy.server();
      cy.route("GET", patientRequestUrl).as("getRecord");
      cy.visit("/patients/1/record", {
        onBeforeLoad: (win) => {
          // eslint-disable-next-line no-param-reassign
          win.fetch = null;
        },
      });
      cy.wait("@getRecord");
    });

    it("should display the patient id", () => {
      cy.get("h1", { timeout: 30000 }).should("have.text", "Patient 1");
    });
  });
});
