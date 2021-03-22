// config.js
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  JIRA_HOST: process.env.JIRA_HOST,
  JIRA_USERNAME: process.env.JIRA_USERNAME,
  JIRA_PASSWORD: process.env.JIRA_PASSWORD,
};
