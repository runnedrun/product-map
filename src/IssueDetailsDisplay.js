import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/Button'
import React, { Component } from 'react'
import Typography from '@material-ui/core/Typography'
const deepExtend = require('underscore-deep-extend')
const deepClone = require('underscore.deepclone')
const _ = require('underscore')

_.mixin({ deepExtend: deepExtend(_) })
_.mixin(deepClone)

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
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120
  },
  titleBar: {
    display: 'flex',
    alignItems: 'center'
  },
  titleBarWrapper: {
    display: 'flex',
    justifyContent: 'center'
  },
  staticSelectorDisplay: {
    marginLeft: '10px'
  }
})

const ToggledEditSelect = withStyles(styles)(
  ({ editable, options, value, classes, onChange }) => {
    const select = (
      <FormControl className={classes.formControl}>
        <Select value={value} onChange={e => onChange(e.target.value)}>
          {Object.keys(options).map(key => {
            const optionDisplayName = options[key]
            return (
              <MenuItem key={key} value={key}>
                {optionDisplayName}
              </MenuItem>
            )
          })}
        </Select>
      </FormControl>
    )

    const staticDisplay = (
      <span className={classes.staticSelectorDisplay}>
        <Typography component="span" variant="h6">
          {options[value]}
        </Typography>
      </span>
    )

    return editable ? select : staticDisplay
  }
)

class IssueDetailsDisplay extends Component {
  constructor(props) {
    super(props)
    this.state = { editing: false, unsavedJiraData: false }
    this.toggleEditingOn = this.toggleEditingOn.bind(this)
    this.saveEdits = this.saveEdits.bind(this)
    this.updateUnsavedAssignee = this.updateUnsavedAssignee.bind(this)
    this.updateUnsavedStatus = this.updateUnsavedStatus.bind(this)
    this.updateUnsavedIssueType = this.updateUnsavedIssueType.bind(this)
  }

  getSavedJiraData() {
    return _.deepClone(this.props.nodeData.node.jiraData)
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
    if (!_.isEqual(this.getUnsavedJiraData(), this.getSavedJiraData())) {
      console.log('updaingingg')
      this.props.updateIssue(this.getPath(), this.getUnsavedJiraData())
    }
    this.setState({ unsavedJiraData: false })
  }

  updateUnsavedJiraData(updateObj) {
    this.setState({
      unsavedJiraData: _.deepExtend(this.state.unsavedJiraData, updateObj)
    })
  }

  updateUnsavedDescription(newDescription) {
    this.updateUnsavedJiraData({
      fields: { description: newDescription }
    })
  }

  updateUnsavedAssignee(newAssignee) {
    if (newAssignee === 'unassigned') {
      this.updateUnsavedJiraData({
        fields: { assignee: null }
      })
    } else {
      this.updateUnsavedJiraData({
        fields: { assignee: { name: newAssignee, key: newAssignee } }
      })
    }
  }

  updateUnsavedStatus(newStatus) {
    this.updateUnsavedJiraData({
      fields: { status: { id: newStatus } }
    })
  }

  updateUnsavedIssueType(newIssueTypeId) {
    this.updateUnsavedJiraData({
      fields: { issuetype: { id: newIssueTypeId } }
    })
  }

  componentDidUpdate(prevProps) {
    this.props.assignChild(this)

    if (
      (!this.props.nodeData && prevProps.nodeData) ||
      (prevProps.nodeData &&
        prevProps.nodeData.node.id !== this.props.nodeData.node.id)
    ) {
      this.setState({ unsavedJiraData: false })
    }
  }

  render() {
    const { nodeData, classes } = this.props

    if (!nodeData) {
      return <div />
    }

    if (this.state.unsavedJiraData) {
      console.log(
        !_.isEqual(this.getUnsavedJiraData(), this.getSavedJiraData()),
        this.getSavedJiraData(),
        this.getUnsavedJiraData()
      )
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
    let currentAssignee
    let currentStatus

    const transitions = this.getSavedJiraData().transitions

    const transitionsObject = {}
    transitions.forEach(transition => {
      transitionsObject[transition.to.id] = transition.to.name
    })

    if (this.state.unsavedJiraData) {
      currentAssignee = this.getUnsavedJiraData().fields.assignee
        ? this.getUnsavedJiraData().fields.assignee.name
        : 'unassigned'

      currentStatus = this.getUnsavedJiraData().fields.status.id
    } else {
      currentAssignee = this.getSavedJiraData().fields.assignee
        ? this.getSavedJiraData().fields.assignee.name
        : 'unassigned'

      currentStatus = this.getSavedJiraData().fields.status.id
    }

    const issueType = this.getSavedJiraData().fields.issuetype

    let issueTypeChooserOptions = {
      '10002': 'Task',
      '10049': 'Information Gathering',
      '10044': 'Spec',
      '10048': 'Experiment'
    }

    if (issueType.subtask) {
      issueTypeChooserOptions = {
        '10003': 'Subtask',
        '10046': 'Problem',
        '10047': 'Requirement'
      }
    }

    return (
      <div>
        <div className={classes.titleBarWrapper}>
          <Typography
            component="h1"
            variant="h3"
            gutterBottom
            className={classes.titleBar}
          >
            {id}
            <ToggledEditSelect
              editable={this.state.unsavedJiraData}
              value={currentAssignee}
              onChange={this.updateUnsavedAssignee}
              options={{
                unassigned: 'Unassigned',
                'maya.neria': 'Maya',
                'david.gaynor': 'David',
                'olufunmilade.oshodi': 'Lade',
                'stephen.njuguna': 'Steve'
              }}
            />

            <ToggledEditSelect
              editable={this.state.unsavedJiraData}
              value={currentStatus}
              onChange={this.updateUnsavedStatus}
              options={transitionsObject}
            />

            <ToggledEditSelect
              editable={this.state.unsavedJiraData}
              value={issueType.id}
              onChange={this.updateUnsavedIssueType}
              options={issueTypeChooserOptions}
            />

            {editOrSaveButton}
          </Typography>
        </div>
        <Typography component="h1" variant="h6" gutterBottom>
          {title}
        </Typography>
        {textDisplay}
      </div>
    )
  }
}

export default withStyles(styles)(IssueDetailsDisplay)
