const axios = require("axios");
const rax = require("retry-axios");

rax.attach();

const dePseudonymize = async (config, resource) => {
  const response = await axios.post(`${config.url}/$de-pseudonymize`, resource, {
    headers: { "x-api-key": config.apiKey, "Content-Type": "application/fhir+json" },
  });
  return response.data;
};

exports.dePseudonymize = dePseudonymize;
