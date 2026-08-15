import { CurriculumNode, CHILD_TYPE, emptyNode, makeId } from "./types";

/** Recursively map over a tree, replacing the node with the given id. */
export function updateNode(
  root: CurriculumNode,
  id: string,
  updater: (node: CurriculumNode) => CurriculumNode
): CurriculumNode {
  if (root.id === id) return updater(root);
  if (root.children.length === 0) return root;
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, id, updater)),
  };
}

/** Add a new child of the appropriate type under the given parent id and return the new node id. */
export function addChildWithId(
  root: CurriculumNode,
  parentId: string
): { tree: CurriculumNode; createdId?: string } {
  let createdId: string | undefined;
  const tree = updateNode(root, parentId, (parent) => {
    const childType = CHILD_TYPE[parent.type];
    if (!childType) return parent;
    const newNode = emptyNode(childType);
    createdId = newNode.id;
    return {
      ...parent,
      collapsed: false,
      children: [...parent.children, newNode],
    };
  });
  return { tree, createdId };
}

/** Add a new child of the appropriate type under the given parent id. */
export function addChild(root: CurriculumNode, parentId: string): CurriculumNode {
  return addChildWithId(root, parentId).tree;
}

/** Remove a node (and its subtree) by id, wherever it lives. */
export function removeNode(root: CurriculumNode, id: string): CurriculumNode {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => removeNode(child, id)),
  };
}

export function toggleCollapsed(root: CurriculumNode, id: string): CurriculumNode {
  return updateNode(root, id, (node) => ({ ...node, collapsed: !node.collapsed }));
}

/**
 * Merge an AI-generated set of modules into the existing curriculum.
 * Deduplicates by normalized module title so re-uploading or overlapping
 * sections update existing modules rather than creating duplicate copies.
 */
export function appendModules(root: CurriculumNode, modules: CurriculumNode[]): CurriculumNode {
  const existingMap = new Map<string, number>();

  root.children.forEach((child, idx) => {
    const norm = child.title
      .toLowerCase()
      .replace(/^(modul\s*\d*|unit\s*\d*|\d+[\.\)]?)\s*[:\-–]?\s*/i, "")
      .replace(/[^a-z0-9]/g, "");

    if (norm.length > 2) {
      existingMap.set(norm, idx);
    }
  });

  const updatedChildren = [...root.children];

  for (const mod of modules) {
    const norm = mod.title
      .toLowerCase()
      .replace(/^(modul\s*\d*|unit\s*\d*|\d+[\.\)]?)\s*[:\-–]?\s*/i, "")
      .replace(/[^a-z0-9]/g, "");

    if (norm.length > 2 && existingMap.has(norm)) {
      // Module already exists in the tree — update it in place instead of creating a duplicate copy
      const existingIdx = existingMap.get(norm)!;
      updatedChildren[existingIdx] = mod;
    } else {
      // Genuinely new module — append to tree
      if (norm.length > 2) {
        existingMap.set(norm, updatedChildren.length);
      }
      updatedChildren.push(mod);
    }
  }

  return {
    ...root,
    children: updatedChildren,
  };
}

/** Re-key every id in an imported subtree so it can never collide with existing ids. */
export function rekey(node: CurriculumNode): CurriculumNode {
  return {
    ...node,
    id: makeId(node.type),
    children: node.children.map(rekey),
  };
}
