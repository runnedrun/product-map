import React, { Component } from 'react'
import './App.css'
import SortableTree from 'react-sortable-tree'
import { getTreeFromFlatData } from 'react-sortable-tree'
import 'react-sortable-tree/style.css' // This only needs to be imported once in your app

const axios = require('axios')

class Tree extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div style={{ height: 400 }}>
        <SortableTree
          getNodeKey={node => {
            return node.node.id
          }}
          treeData={this.props.treeData}
          onChange={treeData => this.props.updateLocalJiraTree(treeData)}
        />
      </div>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      password: localStorage.password,
      username: localStorage.username,
      jiraTree: JSON.parse(localStorage.cachedJira || '{}')
    }
  }

  onPasswordChange(password) {
    this.setState({ password })
    localStorage.password = password
  }

  onUsernameChange(username) {
    this.setState({ username })
    localStorage.username = username
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
        localStorage.cachedJira = JSON.stringify(tree)
        // console.log(response.data)
      })
  }

  parseJiraDataIntoTree(data) {
    // console.log('data', data)
    // console.log(data.issues.map(issue => issue.key))
    // console.log(data.issues.map(issue => issue.fields.parent && issue.fields.parent.key).filter(_ => _))
    // data.issues.push({ key: '0', fields: {} })
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

    console.log('flat', tree)
    return tree
  }

  updateLocalJiraTree(jiraTree) {
    console.log('jira', jiraTree)
    this.setState({ jiraTree })
  }

  render() {
    console.log('this.state', this.state.jiraTree)
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
        <Tree
          updateLocalJiraTree={tree => this.updateLocalJiraTree(tree)}
          treeData={this.state.jiraTree || []}
        />
      </div>
    )
  }
}

export default App
