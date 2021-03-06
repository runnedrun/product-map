import React from 'react'
import SortableTree from 'react-sortable-tree'
import 'react-sortable-tree/style.css'

const Tree = ({ treeData, updateLocalJiraTree }) => {
  return (
    <div style={{ height: 400 }}>
      <SortableTree
        getNodeKey={node => {
          return node.node.id
        }}
        treeData={treeData}
        onChange={treeData => updateLocalJiraTree(treeData)}
        generateNodeProps={({ node }) => {
          const isSelected = node.selected
          return {
            className: `${isSelected ? 'selected-node' : ''} node-wrapper`
          }
        }}
      />
    </div>
  )
}

export default Tree
