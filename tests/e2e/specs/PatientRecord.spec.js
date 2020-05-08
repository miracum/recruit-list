// https://docs.cypress.io/api/introduction/api.html

const patientRequestUrl = "**/Patient/**";

describe("PatientRecord", () => {
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
