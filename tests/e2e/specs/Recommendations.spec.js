// https://docs.cypress.io/api/introduction/api.html

const listRequestUrl = "**/List/?_id=11**";

describe("Recommendations ", () => {
  context("after loading recommendations", () => {
    beforeEach(() => {
      cy.server();
      cy.route("GET", listRequestUrl).as("getList");
      cy.visit("/recommendations/11", {
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

    it("can update and save recruitment status", () => {
      cy.get(":nth-child(1) > [data-label='Status'] > .dropdown > .dropdown-trigger > .button")
        .click()
        .get(
          ":nth-child(1) > [data-label='Status'] > .dropdown > .dropdown-menu > .dropdown-content > :nth-child(4)"
        )
        .click()
        .get(":nth-child(1) > :nth-child(5) > .buttons > .save-status")
        .click();

      cy.reload();

      cy.get(
        ":nth-child(1) > [data-label='Status'] > .dropdown > .dropdown-trigger > .button"
      ).contains("Wurde eingeschlossen");
    });
  });
});
