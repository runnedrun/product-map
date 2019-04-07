const functions = require('firebase-functions')
const escapeHtml = require('escape-html')
const JiraClient = require('jira-connector')

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const corsRequestWithJira = next => (req, res) => {
  console.log('est', req.body.username)
  // Set CORS headers for preflight requests
  // Allows GETs from any origin with the Content-Type header
  // and caches preflight response for 3600s

  res.set('Access-Control-Allow-Origin', '*')

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
  } else {
    // Set CORS headers for the main request
    var jira = new JiraClient({
      host: 'andela.atlassian.net',
      basic_auth: {
        username: req.body.username,
        password: req.body.password
      }
    })

    next(req, res, jira)
      .then(response => {
        res.set('Access-Control-Allow-Origin', '*')
        res.send(response)
      })
      .catch(err => {
        console.log('ERRRR', err)
        res.status(403)
        res.send(`ERROr ${err}`)
      })
  }
}

exports.helloWorld = functions.https.onRequest(
  corsRequestWithJira((req, res, jira) => {
    const searchJira = (startAt = 0, issues = []) =>
      jira.search
        .search({
          jql:
            'project = LS AND issuetype in (Task, Sub-task) AND (assignee = olufunmilade.oshodi OR assignee = maya.neria OR assignee = stephen.njuguna OR assignee IS EMPTY) ORDER BY Rank ASC',
          // 'id = LS-7'
          startAt,
          maxResults: 100
        })
        .then(response => {
          issues = issues.concat(response.issues)
          if (response.issues.length < 100) {
            response.issues = issuess
            return response
          } else {
            return searchJira(startAt + 100, issues)
          }
        })

    return searchJira()
  })
)

exports.editIssue = functions.https.onRequest(
  corsRequestWithJira((req, res, jira) => {
    console.log('here')
    return jira.issue.editIssue({
      issueKey: req.body.issueId,
      issue: {
        fields: req.body.fields
      }
    })
  })
)
