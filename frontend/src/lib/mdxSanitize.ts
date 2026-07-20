import { visit, type VisitorResult } from 'unist-util-visit'
import type { Node, Parent } from 'unist'

const ALLOWED_JSX_COMPONENTS = new Set(['ResumeHeader', 'Job', 'EduItem', 'SkillList'])

interface MdxJsxAttribute {
  type: string
  value?: string | null | object
}

interface MdxJsxNode extends Node {
  name?: string | null
  attributes?: MdxJsxAttribute[]
  children?: Node[]
}

/** Remark plugin: strips MDX's arbitrary-code-execution surfaces before compilation.
 * Resume content is AI-generated or user-pasted, never trusted, but `@mdx-js/mdx`'s
 * `evaluate()` compiles MDX straight to executable JS — `{jsExpression}`, `import`/`export`
 * statements, and JSX tags/attributes are all real code, not just markup. This removes
 * anything outside the resume's known-safe component allowlist (plain markdown, and
 * ResumeHeader/Job/EduItem/SkillList with literal string attributes only) rather than
 * relying on HTML sanitizers, which don't see MDX-specific nodes at all. */
export function stripUnsafeMdx() {
  return (tree: Node) => {
    visit(tree, (node, index, parent): VisitorResult => {
      if (!parent || index === null || index === undefined) return

      if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
        ;(parent as Parent).children.splice(index, 1)
        return index
      }

      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const el = node as MdxJsxNode
        if (el.name && ALLOWED_JSX_COMPONENTS.has(el.name)) {
          el.attributes = (el.attributes ?? []).filter(
            (attr) => attr.type === 'mdxJsxAttribute' && (attr.value == null || typeof attr.value === 'string'),
          )
          return
        }
        // Unknown/dangerous tag (raw HTML like <script>/<img onerror>, or a fragment) — unwrap to its children.
        ;(parent as Parent).children.splice(index, 1, ...((el.children as Node[]) ?? []))
        return index
      }
    })
  }
}
