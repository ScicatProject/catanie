import { Component, HostListener, Input, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Observable } from 'rxjs';
import { FlatNode, TreeBase, TreeNode } from 'shared/modules/scientific-metadata-tree/tree-base';
import { MetadataInput } from 'shared/modules/scientific-metadata-tree/metadata-input/metadata-input.component';
import { HistoryManager } from 'shared/modules/scientific-metadata-tree/history-manager'
import { resultMemoize } from '@ngrx/store';
export class FlatNodeEdit implements FlatNode {
  key: string;
  value: any;
  unit: string;
  level: number;
  expandable: boolean;
  visible: boolean;
  editing: boolean;
}
@Component({
  selector: 'tree-edit',
  templateUrl: './tree-edit.component.html',
  styleUrls: ['./tree-edit.component.scss'],
})
export class TreeEditComponent extends TreeBase implements OnInit {
  @Input() data: any;
  currentEditingNode: FlatNodeEdit | null = null;
  filteredUnits$: Observable<string[]>;
  currentInputData: MetadataInput;
  historyManager: HistoryManager;
  constructor() {
    super();
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<FlatNodeEdit>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.nestNodeMap = new Map<TreeNode, FlatNodeEdit>();
    this.flatNodeMap = new Map<FlatNodeEdit, TreeNode>();
    this.historyManager = new HistoryManager();
  }
  ngOnInit() {
    this.dataTree = this.buildDataTree(this.data, 0);
    this.dataSource.data = this.dataTree;
  }

  transformer = (node: TreeNode, level: number): FlatNodeEdit => {
    const existingNode = this.nestNodeMap.get(node) as FlatNodeEdit;
    const flatNode = existingNode && existingNode.key === node.key ? existingNode : new FlatNodeEdit();
    flatNode.key = node.key;
    flatNode.level = level;
    flatNode.value = node.value;
    flatNode.expandable = !!node.children?.length;
    flatNode.editing = node.key === '' ? true : false;
    flatNode.visible = true;
    flatNode.unit = node.unit;
    this.flatNodeMap.set(flatNode, node);
    this.nestNodeMap.set(node, flatNode);
    return flatNode;
  }
  @HostListener('click', ['$event'])
  stopPropagation(event) {
    event.stopPropagation();
  }
  @HostListener('document:click')
  saveData() {
    if (this.currentEditingNode) {
      const nextEditingNode = this.saveCurrentEditingNodeToDataTree()
      this.setCurrentEditingNode(nextEditingNode);
    }
  }
  buildDataTree(obj: { [key: string]: any }, level: number): TreeNode[] {
    return Object.keys(obj).reduce<TreeNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TreeNode();
      node.key = key;
      if (value) {
        if (typeof value === "object") {
          if ("value" in value) {
            node.value = value.value;
            node.unit = value.unit || null;
          } else {
            node.children = this.buildDataTree(value, level + 1);
          }
        } else {
          node.value = value;
        }
      }
      return accumulator.concat(node);
    }, []);
  }
  convertDataTreeToObject(tree: TreeNode[]): { [key: string]: any } {
    return tree.reduce((accumulator, node) => {
      if (!this.isEmptyNode(node)) {
        if (node.value) {
          accumulator[node.key] = node.value;
        } else {
          if (node.children && node.children.length > 0) {
            accumulator[node.key] = this.convertDataTreeToObject(node.children);
          } else {
            accumulator[node.key] = null;
          }
        }
      }
      return accumulator;
    }, {})
  }
  enableEditing(node: FlatNodeEdit){
    this.saveCurrentEditingNodeToDataTree();
    this.setCurrentEditingNode(node);
  }
  setCurrentEditingNode(node: FlatNodeEdit | null) {
    if (this.currentEditingNode){
      this.currentEditingNode.editing = false;
    }
    this.currentEditingNode = node;
    if(this.currentEditingNode){
      this.currentEditingNode.editing = true;
    }
  }
  setCurrentInputData(data: MetadataInput) {
    this.currentInputData = data;
  }
  saveCurrentEditingNodeToDataTree(): FlatNodeEdit | null {
    if (this.currentEditingNode) {
      if (this.currentInputData) {
        const nestedNode = this.flatNodeMap.get(this.currentEditingNode);
        const currentData = {...nestedNode};
        const newData = {...this.currentInputData};
        this.historyManager.add({
          undo:() => {
            const {key, value, unit} = currentData;
            nestedNode.key = key;
            nestedNode.value = value;
            nestedNode.unit = unit;
            this.dataSource.data = this.dataTree;
          },
          redo: () => {
            this.updateNodeData(nestedNode, newData);
          }
        });
        const node = this.updateNodeData(nestedNode, this.currentInputData)
        this.currentInputData = null;
        return node;
      } else {
        if (this.isEmptyNode(this.currentEditingNode)) {
          this.deleteNode(this.currentEditingNode);
        }
        return null;
      }
    }
  }
  updateNodeData(node: TreeNode, data: MetadataInput):(FlatNodeEdit | null) {
    let nextEditingNode:FlatNodeEdit | null = null;
    switch (data.fieldType) {
      case "date":
        node.key = data.fieldName;
        node.value = Date.parse(data.fieldValue);
        node.unit = null;
        break;
      case "string":
        node.key = data.fieldName;
        node.value = data.fieldValue;
        node.unit = null;
        break;
      case "number":
        node.key = data.fieldName;
        node.value = Number(data.fieldValue);
        node.unit = null;
        break;
      case "quantity":
        node.key = data.fieldName;
        node.value = Number(data.fieldValue);
        node.unit = data.fieldUnit;
        break;
      case "object":
        node.key = data.fieldName;
        node.value = null;
        node.unit = null;
        if (!node.children) {
          node.children = [];
          const childNode = new TreeNode();
          childNode.key="";
          this.insertNode(null, node, childNode);
          this.treeControl.expand(this.nestNodeMap.get(node));
          nextEditingNode = this.nestNodeMap.get(childNode) as FlatNodeEdit;
        }
        break;
      default:
    }
    this.dataSource.data = this.dataTree;
    return nextEditingNode;
  }
  addNewNode(parentNode: FlatNodeEdit){
    const newNode = new TreeNode();
    newNode.key = "";
    this.insertNode(null, this.flatNodeMap.get(parentNode), newNode);
    this.setCurrentEditingNode(this.nestNodeMap.get(newNode) as FlatNodeEdit);
  }
  getIndex(parentNode: TreeNode, node: TreeNode){
    if (parentNode){
      return parentNode.children.indexOf(node);
    }else{
      return this.dataTree.indexOf(node);
    }
  }
  deleteNode(node: FlatNodeEdit) {
    // Get parent node
    const parentNode = this.getNestedParent(node);
    const nestedNode = this.flatNodeMap.get(node);
    const index = this.getIndex(parentNode, nestedNode);
    console.log(index, node);
    this.historyManager.add({
      undo: () => {
        console.log("undo",index, node);
        this.insertNode(index,parentNode, nestedNode);
      },
      redo: () => {
        this.removeNode(parentNode, nestedNode);
      }
    });
    this.removeNode(parentNode, nestedNode);
  }
  isEmptyNode = (node: TreeNode | FlatNodeEdit) => node.key === "";

  hasNoContent = (_: number, _nodeData: FlatNodeEdit) => _nodeData.key === '';

  isEditing(_: number, node: FlatNodeEdit) {
    return node.editing;
  }
  doSave() {
    this.data = this.convertDataTreeToObject(this.dataTree);
  }
}