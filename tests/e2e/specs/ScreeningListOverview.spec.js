// https://docs.cypress.io/api/introduction/api.html
import oidcConfig from "../fixtures/keycloak";

const listRequestUrl = "**/List/**";

describe("ScreeningListOverview", () => {
  beforeEach(() => {
    cy.login(oidcConfig);
  });
  context("after loading lists from server", () => {
    beforeEach(() => {
      cy.server();
      cy.route("GET", listRequestUrl).as("getLists");
      cy.visit("/", {
        onBeforeLoad: (win) => {
          // eslint-disable-next-line no-param-reassign
          win.fetch = null;
        },
      });
      cy.wait("@getLists");
    });

    it("three cards for the sample studies exist", () => {
      cy.get(".card", { timeout: 30000 }).should("have.length", 3);
    });

    it("displays the PROSa, AMICA, and SECRET studies", () => {
      cy.contains("PROSa");
      cy.contains("AMICA");
      cy.contains("SECRET");
    });

    // we can't easily test this since it requires the server components to be running and
    // filtering out the resource before display
    // it("does not display the inaccessible SECRET study", () => {
    //   cy.not.contains("SECRET");
    // });
  });
});
