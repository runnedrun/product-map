import { withStyles } from '@material-ui/core/styles'
import React, { Component } from 'react'
import './App.css'
import {
  getTreeFromFlatData,
  changeNodeAtPath,
  map as mapNodesInTree,
  find as findInTree
} from 'react-sortable-tree'
import IssueDetailsDisplay from './IssueDetailsDisplay.js'
import Tree from './Tree.js'

const axios = require('axios')

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
        localStorage.cachedJira &&
        this.parseJiraDataIntoTree(JSON.parse(localStorage.cachedJira))
    }
    this.selectIssue = this.selectIssue.bind(this)
    this.updateIssue = this.updateIssue.bind(this)
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
        this.setState({ jiraTree: tree })
        localStorage.cachedJira = JSON.stringify(response.data)
        // console.log(response.data)
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

    return tree.slice(tree.length - 3, tree.length)
  }

  updateLocalJiraTree(jiraTree) {
    this.setState({ jiraTree })
  }

  updateIssue(path, newJiraData) {
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
        fields: newJiraData.fields
      })
      .then(response => {
        console.log('updated', response)
      })

    this.setState({ jiraTree: newTree })
  }

  render() {
    const classes = this.props.classes

    const { matches } = findInTree({
      getNodeKey: ({ node }) => node.id,
      treeData: this.state.jiraTree,
      searchMethod: ({ node }) => node.selected
    })

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
              treeData={this.state.jiraTree || []}
              selectIssue={this.selectIssue}
            />
          </div>
          <div className={classes.displayRight}>
            <IssueDetailsDisplay
              nodeData={matches[0]}
              updateIssue={this.updateIssue}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(App)
