// https://docs.cypress.io/api/introduction/api.html

const listRequestUrl = "**/List/**";

describe("PatientRecommendations", () => {
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

    it("two tabs for the sample studies exist", () => {
      cy.get(".b-tabs > nav > ul > li", { timeout: 30000 }).should("have.length", 2);
    });

    it("can switch between the two study tabs", () => {
      cy.contains("Burden and Medical Care of Sarcoma in Germany");

      cy.get(".b-tabs > nav > ul > li", { timeout: 30000 })
        .eq(1)
        .click();

      cy.contains("Antihormonelle Erhaltungstherapie");
    });
  });
});
