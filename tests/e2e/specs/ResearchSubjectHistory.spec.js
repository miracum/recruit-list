// https://docs.cypress.io/api/introduction/api.html
import oidcConfig from "../fixtures/keycloak";

const subjectRequestUrl = "**/ResearchSubject/**";

describe("ResearchSubjectHistory", () => {
  beforeEach(() => {
    cy.login(oidcConfig);
  });
  context("after loading lists from server", () => {
    beforeEach(() => {
      cy.server();
      cy.route("GET", subjectRequestUrl).as("getSubject");
      cy.visit("/subjects/783/history", {
        onBeforeLoad: (win) => {
          // eslint-disable-next-line no-param-reassign
          win.fetch = null;
        },
      });
      cy.wait("@getSubject");
    });

    it("should display the patient id", () => {
      cy.get("h1", { timeout: 30000 }).should(
        "have.text",
        "Patient bf3d74b1-5abf-4af9-89a3-69ee772bd88f"
      );
    });
  });
});
