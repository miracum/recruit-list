// https://docs.cypress.io/api/introduction/api.html

const listRequestUrl =
  "**/List?code=http://miracum.org/fhir/CodeSystem/screening-list|screening-recommendations";

describe("Homepage is loading correctly", () => {
  it("Two tabs for the sample studies exist", () => {
    cy.server();
    cy.route("GET", listRequestUrl).as("getLists");
    cy.visit("/", {
      onBeforeLoad: (win) => {
        // eslint-disable-next-line no-param-reassign
        win.fetch = null;
      },
    });
    cy.wait("@getLists");

    cy.get(".b-tabs > nav > ul > li", { timeout: 30000 }).should("have.length", 2);
  });

  it("Can switch between the two study tabs", () => {
    cy.server();
    cy.route("GET", listRequestUrl).as("getLists");
    cy.visit("/", {
      onBeforeLoad: (win) => {
        // eslint-disable-next-line no-param-reassign
        win.fetch = null;
      },
    });

    cy.wait("@getLists");

    cy.contains("Burden and Medical Care of Sarcoma in Germany");

    cy.get(".b-tabs > nav > ul > li", { timeout: 30000 })
      .eq(1)
      .click();

    cy.contains("Antihormonelle Erhaltungstherapie");
  });
});
