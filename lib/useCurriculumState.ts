"use client";

import { useCallback, useReducer } from "react";
import { CurriculumNode, emptyCurriculum } from "./types";
import { addChildWithId, appendModules, rekey, removeNode, toggleCollapsed, updateNode } from "./tree";

interface CurriculumState {
  tree: CurriculumNode;
  lastCreatedId: string | null;
}

type Action =
  | { type: "SET_TITLE"; id: string; value: string }
  | { type: "SET_DESCRIPTION"; id: string; value: string }
  | { type: "ADD_CHILD"; parentId: string }
  | { type: "DELETE_NODE"; id: string }
  | { type: "TOGGLE_COLLAPSED"; id: string }
  | { type: "IMPORT_MODULES"; modules: CurriculumNode[] }
  | { type: "CLEAR_LAST_CREATED_ID" }
  | { type: "CLEAR_TREE" };

function reducer(state: CurriculumState, action: Action): CurriculumState {
  switch (action.type) {
    case "SET_TITLE":
      return {
        ...state,
        tree: updateNode(state.tree, action.id, (n) => ({ ...n, title: action.value })),
      };
    case "SET_DESCRIPTION":
      return {
        ...state,
        tree: updateNode(state.tree, action.id, (n) => ({ ...n, description: action.value })),
      };
    case "ADD_CHILD": {
      const { tree: newTree, createdId } = addChildWithId(state.tree, action.parentId);
      return {
        tree: newTree,
        lastCreatedId: createdId ?? null,
      };
    }
    case "DELETE_NODE":
      return {
        ...state,
        tree: removeNode(state.tree, action.id),
      };
    case "TOGGLE_COLLAPSED":
      return {
        ...state,
        tree: toggleCollapsed(state.tree, action.id),
      };
    case "IMPORT_MODULES":
      return {
        ...state,
        tree: appendModules(state.tree, action.modules.map(rekey)),
      };
    case "CLEAR_LAST_CREATED_ID":
      return {
        ...state,
        lastCreatedId: null,
      };
    case "CLEAR_TREE":
      return {
        tree: {
          ...state.tree,
          title: "Untitled Program",
          description: "",
          children: [],
        },
        lastCreatedId: null,
      };
    default:
      return state;
  }
}

export function useCurriculumState(initialTitle = "Untitled Program") {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    tree: emptyCurriculum(initialTitle),
    lastCreatedId: null,
  }));

  const setTitle = useCallback((id: string, value: string) => dispatch({ type: "SET_TITLE", id, value }), []);
  const setDescription = useCallback(
    (id: string, value: string) => dispatch({ type: "SET_DESCRIPTION", id, value }),
    []
  );
  const addChildTo = useCallback((parentId: string) => dispatch({ type: "ADD_CHILD", parentId }), []);
  const deleteNode = useCallback((id: string) => dispatch({ type: "DELETE_NODE", id }), []);
  const toggleNode = useCallback((id: string) => dispatch({ type: "TOGGLE_COLLAPSED", id }), []);
  const importModules = useCallback(
    (modules: CurriculumNode[]) => dispatch({ type: "IMPORT_MODULES", modules }),
    []
  );
  const clearLastCreatedId = useCallback(() => dispatch({ type: "CLEAR_LAST_CREATED_ID" }), []);
  const clearTree = useCallback(() => dispatch({ type: "CLEAR_TREE" }), []);

  return {
    tree: state.tree,
    lastCreatedId: state.lastCreatedId,
    setTitle,
    setDescription,
    addChildTo,
    deleteNode,
    toggleNode,
    importModules,
    clearLastCreatedId,
    clearTree,
  };
}
