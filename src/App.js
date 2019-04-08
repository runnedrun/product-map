import { withStyles } from '@material-ui/core/styles'
import React, { Component } from 'react'
import './App.css'
import {
  getTreeFromFlatData,
  changeNodeAtPath,
  map as mapNodesInTree,
  find as findInTree,
  getNodeAtPath
} from 'react-sortable-tree'
import IssueDetailsDisplay from './IssueDetailsDisplay.js'
import Tree from './Tree.js'

const axios = require('axios')
const deepObjectDiff = require('deep-object-diff')

const styles = theme => ({
  mainDisplay: {
    display: 'flex',
    width: '100%'
  },
  displayLeft: {
    width: '50%',
    flexShrink: 0
  },
  displayRight: {
    flexGrow: 1,
    padding: '10px'
  }
})

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      password: localStorage.password,
      username: localStorage.username,
      jiraTree:
        localStorage.cachedJiraTree && JSON.parse(localStorage.cachedJiraTree)
    }

    this.selectIssue = this.selectIssue.bind(this)
    this.updateIssueInJira = this.updateIssueInJira.bind(this)
  }

  onPasswordChange(password) {
    this.setState({ password })
    localStorage.password = password
  }

  onUsernameChange(username) {
    this.setState({ username })
    localStorage.username = username
  }

  changeNodeAtPath(path, changeFn) {
    return changeNodeAtPath({
      treeData: this.state.jiraTree,
      path: path,
      newNode: changeFn,
      getNodeKey: ({ node }) => node.id
    })
  }

  selectIssue(nodeId) {
    let doIt = true
    if (
      this.issueDisplayRef &&
      this.issueDisplayRef.state &&
      this.issueDisplayRef.state.unsavedJiraData
    ) {
      doIt = window.confirm('Your unsaved changes will be lost')
    }

    if (!doIt) {
      return
    }

    const newTree = mapNodesInTree({
      treeData: this.state.jiraTree,
      getNodeKey: _ => _.id,
      callback: ({ node }) => {
        if (node.id === nodeId) {
          node.selected = true
        } else {
          node.selected = false
        }
        return node
      }
    })

    this.setState({ jiraTree: newTree })
  }

  fetchJira() {
    axios
      .post('http://localhost:5000/product-map-2363b/us-central1/helloWorld', {
        username: this.state.username,
        password: this.state.password
      })
      .then(response => {
        // handle success
        const tree = this.parseJiraDataIntoTree(response.data)
        this.updateLocalJiraTree(tree)
      })
  }

  parseJiraDataIntoTree(data) {
    const ourFormat = data.issues.map(issue => {
      return {
        title: issue.fields.summary,
        // subtitle: issue.fields.description,
        jiraData: issue,
        id: issue.key,
        parentId: (issue.fields.parent && issue.fields.parent.key) || '0'
      }
    })

    const tree = getTreeFromFlatData({
      flatData: ourFormat
    })

    return tree
  }

  updateLocalJiraTree(jiraTree) {
    localStorage.cachedJiraTree = JSON.stringify(jiraTree)
    this.setState({ jiraTree })
  }

  updateIssueInJira(path, newJiraData) {
    const { node } = getNodeAtPath({
      treeData: this.state.jiraTree,
      path: path,
      getNodeKey: ({ node }) => node.id
    })

    const onlyChangedFields = deepObjectDiff.updatedDiff(
      node.jiraData,
      newJiraData
    )

    let transitionToDo
    if (onlyChangedFields.fields.status) {
      const transitions = node.jiraData.transitions

      transitions.forEach(transition => {
        if (transition.to.id === onlyChangedFields.fields.status.id) {
          transitionToDo = transition.id
        }
      })

      delete onlyChangedFields.fields.status
    }

    const newTree = this.changeNodeAtPath(path, ({ node }) => {
      node.jiraData = newJiraData
      return node
    })

    const issueId = path[path.length - 1]

    axios
      .post('http://localhost:5000/product-map-2363b/us-central1/editIssue', {
        username: this.state.username,
        password: this.state.password,
        issueId,
        fields: onlyChangedFields.fields,
        transitionId: transitionToDo
      })
      .then(response => {
        console.log('updated', response)
      })

    this.updateLocalJiraTree(newTree)
  }

  render() {
    const classes = this.props.classes

    const { matches } = findInTree({
      getNodeKey: ({ node }) => node.id,
      treeData: this.state.jiraTree,
      searchMethod: ({ node }) => node.selected
    })

    let tree = []
    if (this.state.jiraTree) {
      tree = this.state.jiraTree.slice(
        this.state.jiraTree.length - 3,
        this.state.jiraTree.length
      )
    }

    return (
      <div className="App">
        <div>
          <div>
            username
            <input
              value={this.state.username}
              onChange={e => this.onUsernameChange(e.target.value)}
            />
          </div>
          <div>
            password
            <input
              value={this.state.password}
              onChange={e => this.onPasswordChange(e.target.value)}
              type="password"
            />
          </div>
        </div>
        <div>
          {this.state.password && this.state.username ? (
            <button onClick={() => this.fetchJira()}>Fetch Jira</button>
          ) : (
            ''
          )}
        </div>
        <div className={classes.mainDisplay}>
          <div className={classes.displayLeft}>
            <Tree
              updateLocalJiraTree={tree => this.updateLocalJiraTree(tree)}
              treeData={tree}
              selectIssue={this.selectIssue}
            />
          </div>
          <div className={classes.displayRight}>
            <IssueDetailsDisplay
              nodeData={matches[0]}
              updateIssue={this.updateIssueInJira}
              assignChild={ref => {
                this.issueDisplayRef = ref
              }}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(App)
