#!/usr/bin/env node
// index.js

const { exec } = require('child_process');
const { JIRA_HOST, JIRA_USERNAME, JIRA_PASSWORD } = require('./config');

const { changeStatusString, getItemInfoString, getTagName } = require('./jira');
const JiraApi = require('jira-client');

const argv = require('yargs')
  .version()
  .usage('Usage: gitj <command> [options]')
  .command(
    ['start <issueId> [branchTag]', 's'],
    'Create a new git branch from a JIRA Issue',
    function (yargs) {
      return yargs
        .positional('issueId', {
          type: 'string',
        })
        .positional('branchTag', { type: 'string' });
    }
  )
  .example(
    'gitj start ME-123',
    'Create a new git branch called "feature/ME-123" and change the status of the corresponding JIRA issue with Id ME-123 to "In Progress".'
  )
  .example(
    'gitj ME-123 "modal component"',
    'Create a new git branch called "feature/ME-123-modal_component" and change the status of the corresponding JIRA issue with Id ME-123 to "In Progress".'
  )
  .example(
    'gitj pr',
    'Push the current git branch to the remote github repository and create a pull request with the title of the corresponding JIRA issue and a body with the JIRA issue Id. This will create a linkage in the Github PR column of the JIRA board.'
  )
  .command(
    ['pr'],
    'Push the current branch to the remote repository and create a pull request.'
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help('h')
  .alias('h', 'help')
  .epilogue(
    'for more information, find the documentation at https://github.com/zrachlin/git-jira-cli#readme'
  ).argv;

if (!JIRA_HOST || !JIRA_USERNAME || !JIRA_PASSWORD) {
  console.error(
    'You must provide valid JIRA_HOST, JIRA_USERNAME, and JIRA_PASSWORD values in your .env file.'
  );
  return;
}
// Initialize
const jira = new JiraApi({
  protocol: 'https',
  host: JIRA_HOST,
  username: JIRA_USERNAME,
  password: JIRA_PASSWORD,
  apiVersion: '2',
  strictSSL: true,
});

// Anonymous arguments
const aArgs = argv._;

if (aArgs[0] === 'start') {
  start(argv.issueId, argv.branchTag);
  return;
}

if (aArgs[0] === 'pr') {
  pr();
  return;
}

async function start(issueId, branchTag) {
  try {
    const issue = await jira.findIssue(issueId);
    // console.log(issue);
    const issueType = issue.fields.issuetype;
    console.log(issueType.name);
    const { transitions } = await jira.listTransitions(issueId);
    console.log(transitions);

    // need to get the transition objects from JIRA admin
    const res = await jira.transitionIssue(issueId);
    console.log(res);
    // await jira.updateIssue(issueId,{
    //   fields: {
    //     status: {
    //       name: ''
    //     }
    //   }
    // })

    // console.log(`Status: ${issue.fields.status.name}`);
  } catch (err) {
    console.error(err);
  }
  // const itemInfoString = getItemInfoString(itemId);
  // const { data } = await monday.api(itemInfoString);
  // const { column_values } = data.items[0];
  // let tagId;
  // if (MONDAY_ITEM_TYPE_COLUMN_ID) {
  //   const tagColumn = column_values.find(
  //     el => el.id === MONDAY_ITEM_TYPE_COLUMN_ID
  //   );

  //   if (tagColumn && tagColumn.value) {
  //     tagId = JSON.parse(tagColumn.value).tag_ids[0];
  //   }
  // }
  // let tagName = 'feature';
  // if (tagId) {
  //   const tagsString = getTagName(tagId);
  //   const { data: data2 } = await monday.api(tagsString);
  //   tagName = data2.tags[0].name;
  // }

  // let branchName = `${tagName}/${itemId}`;
  // if (branchTag) {
  //   branchName += `-${branchTag.split(' ').join('_')}`;
  // }

  // exec(`git checkout -b ${branchName}`, (err, stdout, stderr) => {
  //   if (err) {
  //     //some err occurred
  //     console.error(err);
  //   } else {
  //     // the *entire* stdout and stderr (buffered)
  //     console.log(stdout);
  //     console.log(stderr);
  //   }
  // });
  // if (MONDAY_STATUS_COLUMN_ID) {
  //   const mondayString = changeStatusString(
  //     MONDAY_BOARD_ID,
  //     itemId,
  //     MONDAY_STATUS_COLUMN_ID,
  //     'Working on it'
  //   );
  //   const res = await monday.api(mondayString);
  // }
}

async function pr() {
  exec(`git rev-parse --abbrev-ref HEAD`, async (err, stdout, stderr) => {
    if (err) {
      //some err occurred
      console.error(err);
    } else {
      // the *entire* stdout and stderr (buffered)
      const branch = stdout;
      let itemId;
      try {
        itemId = branch.split('/')[1].split('-')[0];
      } catch {
        throw new Error(
          'Your branch name was not recognized as valid. Please make sure you use the gitmon start command to create your branch.'
        );
      }

      const itemInfoString = getItemInfoString(itemId);
      const { data } = await monday.api(itemInfoString);
      const { name } = data.items[0];
      exec(`git push origin ${branch}`, (err, stdout, stderr) => {
        if (err) {
          //some err occurred
          console.error(err);
        } else {
          // the *entire* stdout and stderr (buffered)
          console.log(stdout);
          // console.log(`stderr: ${stderr}`);
          exec(
            `gh pr create --title "${name}" --body "Monday ID: #${itemId}"`,
            (err, stdout, stderr) => {
              if (err) {
                //some err occurred
                console.error(err);
              } else {
                // the *entire* stdout and stderr (buffered)
                console.log(stdout);
                // console.log(`stderr: ${stderr}`);
              }
            }
          );
        }
      });
      if (MONDAY_STATUS_COLUMN_ID) {
        const status_string = changeStatusString(
          MONDAY_BOARD_ID,
          itemId,
          MONDAY_STATUS_COLUMN_ID,
          'In Review'
        );
        const res = await monday.api(status_string);
      }
    }
  });
}
