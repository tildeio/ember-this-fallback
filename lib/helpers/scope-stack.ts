import { type AST } from '@glimmer/syntax';

// From https://github.com/embroider-build/embroider/blob/137fcab566174aad3ebb67dda12ac80572f78ab9/packages/compat/src/resolver-transform.ts#L46-L86
const GLOBALS = [
  '-get-dynamic-var',
  '-in-element',
  '-with-dynamic-vars',
  'action',
  'array',
  'component',
  'concat',
  'debugger',
  'each-in',
  'each',
  'fn',
  'get',
  'has-block-params',
  'has-block',
  'hasBlock',
  'hasBlockParams',
  'hash',
  'helper',
  'if',
  'in-element',
  'input',
  'let',
  'link-to',
  'loc',
  'log',
  'modifier',
  'mount',
  'mut',
  'on',
  'outlet',
  'partial',
  'query-params',
  'readonly',
  'textarea',
  'unbound',
  'unique-id',
  'unless',
  'with',
  'yield',
];

class ScopeFrame {
  constructor(
    private readonly locals: string[],
    readonly parent: ScopeFrame | null
  ) {}

  has(local: string): boolean {
    return this.locals.includes(local) || (this.parent?.has(local) ?? false);
  }

  child(locals: string[]): ScopeFrame {
    return new ScopeFrame(locals, this);
  }
}

/**
 * Simple tracker for the current stack of local variable names.
 *
 * @example
 * ```
 * // initialize ScopeStack with the default GLOBALS scope at the head
 * const scopeStack = new ScopeStack();
 * scopeStack.has('array');  //=> true, because it's a global
 * scopeStack.has('local1'); //=> false, because it's not in scope yet
 *
 * // Add a new scope frame
 * scopeStack.push(['local1', 'local2']);
 * scopeStack.has('array');  //=> true, because it's still in scope
 * scopeStack.has('local1'); //=> true, because it's now in scope
 *
 * // Remove the latest scope frame
 * scopeStack.pop();
 * scopeStack.has('array');  //=> true, because it's still in scope
 * scopeStack.has('local1'); //=> false, because it's gone out of scope
 * ```
 */
export default class ScopeStack {
  private head = new ScopeFrame(GLOBALS, null);

  get size(): number {
    let length = 0;
    let current: ScopeFrame | null = this.head;
    while (current) {
      length++;
      current = current.parent;
    }
    return length;
  }

  /** Add a new scope frame with the given variable names. */
  push(locals: string[]): void {
    this.head = this.head.child(locals);
  }

  /** Remove the latest scope frame. */
  pop(): void {
    const parent = this.head.parent;
    if (parent === null) {
      throw new Error('unbalanced push and pop');
    }
    this.head = parent;
  }

  /**
   * Returns `true` if the given variable name is available in this ScopeStack.
   */
  has(name: string): boolean {
    return this.head.has(name);
  }
}

/**
 * Checks if the given `PathHead` is in scope for the given `ScopeStack`.
 * Will return `true` if the `PathHead` is NOT in scope. Since only `VarHead`s
 * can be out-of-scope, will also narrow the type of the `head` param to
 * `VarHead` as a convenience in this case.
 */
export function headNotInScope(
  head: AST.PathHead,
  scope: ScopeStack
): head is AST.VarHead {
  return head.type === 'VarHead' && !scope.has(head.name);
}

/**
 * Gives a local variable name matching the desired name if it is not already
 * within scope.
 * If the desired name is already within scope, it will be suffixed with a
 * number to ensure it does not overwrite an existing local variable.
 */
export function unusedNameLike(desiredName: string, scope: ScopeStack): string {
  let candidate = desiredName;
  let counter = 0;
  while (scope.has(candidate)) {
    candidate = `${desiredName}${counter++}`;
  }
  return candidate;
}
