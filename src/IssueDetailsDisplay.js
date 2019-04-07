import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import React, { Component } from 'react'
import Typography from '@material-ui/core/Typography'

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 700
  },
  descriptionDisplay: {
    display: 'flex'
  },
  saveButton: {
    marginLeft: '10px'
  },
  staticDescriptionDisplay: {
    whiteSpace: 'pre-wrap',
    textAlign: 'left'
  }
})

class IssueDetailsDisplay extends Component {
  constructor(props) {
    super(props)
    this.state = { editing: false, unsavedJiraData: false }
    this.toggleEditingOn = this.toggleEditingOn.bind(this)
    this.saveEdits = this.saveEdits.bind(this)
  }

  getSavedJiraData() {
    return this.props.nodeData.node.jiraData
  }

  getUnsavedJiraData() {
    return this.state.unsavedJiraData
  }

  toggleEditingOn() {
    this.setState({ unsavedJiraData: this.getSavedJiraData() })
  }

  getPath() {
    return this.props.nodeData.path
  }

  saveEdits() {
    this.props.updateIssue(this.getPath(), this.getUnsavedJiraData())
    this.setState({ unsavedJiraData: false })
  }

  updateUnsavedJiraData(updateObj) {
    this.setState({
      unsavedJiraData: Object.assign({}, this.state.unsavedJiraData, updateObj)
    })
  }

  updateUnsavedDescription(newDescription) {
    this.updateUnsavedJiraData({
      fields: { description: newDescription }
    })
  }

  render() {
    const { nodeData, classes } = this.props

    if (!nodeData) {
      return <div />
    }

    const {
      node: { id, title, jiraData: savedJiraData }
    } = nodeData

    const textDisplay = this.getUnsavedJiraData() ? (
      <TextField
        id="standard-multiline-flexible"
        value={this.getUnsavedJiraData().fields.description}
        onChange={e => this.updateUnsavedDescription(e.target.value)}
        margin="normal"
        variant="outlined"
        multiline
        className={classes.descriptionDisplay}
      />
    ) : (
      <div
        className={classes.staticDescriptionDisplay}
        dangerouslySetInnerHTML={{ __html: savedJiraData.fields.description }}
      />
    )

    const editOrSaveButton = this.state.unsavedJiraData ? (
      <Button
        variant="contained"
        color="primary"
        className={classes.saveButton}
        onClick={this.saveEdits}
      >
        Save
      </Button>
    ) : (
      <Button
        variant="contained"
        color="secondary"
        className={classes.saveButton}
        onClick={this.toggleEditingOn}
      >
        Edit
      </Button>
    )

    return (
      <div>
        <Typography component="h1" variant="h3" gutterBottom>
          {id}
          {editOrSaveButton}
        </Typography>
        <Typography component="h1" variant="h6" gutterBottom>
          {title}
        </Typography>
        {textDisplay}
      </div>
    )
  }
}

export default withStyles(styles)(IssueDetailsDisplay)
