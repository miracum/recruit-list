// https://docs.cypress.io/api/introduction/api.html

const listRequestUrl = "**/List/**";

describe("ScreeningListOverview", () => {
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

    it("two cards for the sample studies exist", () => {
      cy.get(".card", { timeout: 30000 }).should("have.length", 2);
    });
  });
});
