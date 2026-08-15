/**
 * The whole app is built around one shape: a CurriculumNode tree.
 * Manual creation and AI-generated import both produce/mutate this exact
 * shape, through the same functions — that's what makes "AI output is
 * immediately editable, exactly like manual content" true rather than claimed.
 */

export type NodeType = "curriculum" | "module" | "topic" | "lesson";

export interface CurriculumNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  children: CurriculumNode[];
  /** True only for nodes the AI inferred rather than found explicitly in the source PDF. */
  aiInferred?: boolean;
  /** UI-only: whether children are expanded. Not persisted logic, just view state. */
  collapsed?: boolean;
}

export const CHILD_TYPE: Record<NodeType, NodeType | null> = {
  curriculum: "module",
  module: "topic",
  topic: "lesson",
  lesson: null,
};

export const ADD_LABEL: Record<NodeType, string> = {
  curriculum: "Add Module",
  module: "Add Topic",
  topic: "Add Lesson",
  lesson: "",
};

let counter = 0;
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

export function emptyNode(type: NodeType, title = ""): CurriculumNode {
  return {
    id: makeId(type),
    type,
    title,
    description: "",
    children: [],
  };
}

export function emptyCurriculum(title = "Untitled Program"): CurriculumNode {
  return {
    id: makeId("curriculum"),
    type: "curriculum",
    title,
    description: "",
    children: [],
  };
}
