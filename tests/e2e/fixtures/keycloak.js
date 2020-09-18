const oidcConfig = {
  root: Cypress.env("KEYCLOAK") || "http://localhost:8083",
  realm: "MIRACUM",
  username: "user1",
  password: "user1",
  client_id: "uc1-screeninglist",
  redirect_uri: "http://list:8080/recommendations",
};

export default oidcConfig;
