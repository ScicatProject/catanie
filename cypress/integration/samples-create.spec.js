/// <reference types="Cypress" />

describe("Samples", function() {
  beforeEach(function() {
    cy.wait(5000);

    cy.login(Cypress.config("username"), Cypress.config("password"));

    cy.server();
    cy.route("POST", "/api/v3/Samples").as("create");
    cy.route("GET", "*").as("fetch");
  });

  after(function() {
    cy.removeSamples();
  });

  describe("Create sample", function() {
    it("should create a new sample", function() {
      cy.visit("/samples");

      cy.wait("@fetch");

      cy.get("mat-card")
        .contains("Create Sample")
        .click();

      cy.get("mat-dialog-container").should("contain.text", "Sample Entry");

      cy.get("#descriptionInput").type("Cypress Sample");
      cy.get("#groupInput").type("ess");

      cy.get("button")
        .contains("Save")
        .click();

      cy.wait("@create").then(response => {
        expect(response.method).to.eq("POST");
        expect(response.status).to.eq(200);
      });

      cy.get(".mat-table")
        .children()
        .should("contain.text", "Cypress Sample");
    });
  });
});
