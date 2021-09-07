// https://docs.cypress.io/api/introduction/api.html
import oidcConfig from "../fixtures/keycloak";

const listRequestUrl = "**/List/?_id=**";

describe("Recommendations ", () => {
  beforeEach(() => {
    cy.login(oidcConfig);
  });
  context("after loading recommendations", () => {
    beforeEach(() => {
      cy.server();
      cy.route("GET", listRequestUrl).as("getList");
      cy.route("PATCH", "**/ResearchSubject/**").as("patchSubject");
      cy.visit("/recommendations/794", {
        onBeforeLoad: (win) => {
          // eslint-disable-next-line no-param-reassign
          win.fetch = null;
        },
      });
      cy.wait("@getList", { timeout: 30000 });
    });

    it("displays PROSa sample study", () => {
      cy.contains("PROSa");
    });

    it("displays correct total recommendations and participating studies count", () => {
      cy.get(":nth-child(1) > [data-label='Marker'] .all-recommendations-count").should(
        "contain.text",
        "2"
      );
      cy.get(":nth-child(1) > [data-label='Marker'] .participating-studies-count").should(
        "contain.text",
        "1"
      );
    });

    it("can update and save recruitment status", () => {
      cy.get(":nth-child(1) > [data-label='Status'] > .dropdown > .dropdown-trigger > .button")
        .click()
        .get(
          ":nth-child(1) > [data-label='Status'] > .dropdown > .dropdown-menu > .dropdown-content > :nth-child(4)"
        )
        .click()
        .get(":nth-child(1) > [data-label='Aktionen'] .save-status")
        .click();

      cy.wait("@patchSubject", { timeout: 30000 });
      // hmm, this is not a great workaround, but it seems it takes
      // some thime for the FHIR server to respond with the updated resource
      // maybe some sort of caching issue.
      cy.wait(5000);
      cy.reload();

      cy.get(
        ":nth-child(1) > [data-label='Status'] > .dropdown > .dropdown-trigger > .button"
      ).contains("Wurde eingeschlossen");
    });
  });
});
