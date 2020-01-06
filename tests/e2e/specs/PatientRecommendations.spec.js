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

    cy.contains("Krankheitslast und Versorgungssituation");

    cy.get(".b-tabs > nav > ul > li", { timeout: 30000 })
      .eq(1)
      .click();

    cy.contains("This is a multicenter");
  });
});

describe("Setting recruitment status", () => {
  it("Can change recruitment status to candidate", () => {
    cy.server();
    cy.route("PUT", "**/ResearchSubject/*").as("updateResearchSubject");

    // workaround (https://github.com/cypress-io/cypress/issues/95) to force
    // the polyfill to use XHR instead of the fetch API to allow the request
    // to be captured
    cy.visit("/", {
      onBeforeLoad: (win) => {
        // eslint-disable-next-line no-param-reassign
        win.fetch = null;
      },
    });

    cy.get(".recruitment-status-select select", { timeout: 30000 })
      .eq(1)
      .should("have.value", "candidate");

    cy.get(".recruitment-status-select select", { timeout: 30000 })
      .eq(1)
      .select("eligible")
      .invoke("val");

    cy.wait("@updateResearchSubject");

    cy.reload();

    cy.get(".recruitment-status-select select", { timeout: 30000 })
      .eq(1)
      .should("have.value", "eligible");
  });
});
