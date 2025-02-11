import {
  CONST,
  Type,
  stringify,
  isPresent,
  StringWrapper,
  isString
} from 'angular2/src/core/facade/lang';
import {DependencyMetadata, resolveForwardRef} from 'angular2/src/core/di';

/**
 * Specifies that a constant attribute value should be injected.
 *
 * The directive can inject constant string literals of host element attributes.
 *
 * ## Example
 *
 * Suppose we have an `<input>` element and want to know its `type`.
 *
 * ```html
 * <input type="text">
 * ```
 *
 * A decorator can inject string literal `text` like so:
 *
 * ```javascript
 * @Directive({
 *   selector: `input'
 * })
 * class InputDirective {
 *   constructor(@Attribute('type') type) {
 *     // type would be `text` in this example
 *   }
 * }
 * ```
 */
@CONST()
export class AttributeMetadata extends DependencyMetadata {
  constructor(public attributeName: string) { super(); }

  get token() {
    // Normally one would default a token to a type of an injected value but here
    // the type of a variable is "string" and we can't use primitive type as a return value
    // so we use instance of Attribute instead. This doesn't matter much in practice as arguments
    // with @Attribute annotation are injected by ElementInjector that doesn't take tokens into
    // account.
    return this;
  }
  toString(): string { return `@Attribute(${stringify(this.attributeName)})`; }
}

/**
 * Declares an injectable parameter to be a live list of directives or variable
 * bindings from the content children of a directive.
 *
 * ### Example ([live demo](http://plnkr.co/edit/lY9m8HLy7z06vDoUaSN2?p=preview))
 *
 * Assume that `<tabs>` component would like to get a list its children `<pane>`
 * components as shown in this example:
 *
 * ```html
 * <tabs>
 *   <pane title="Overview">...</pane>
 *   <pane *ng-for="#o of objects" [title]="o.title">{{o.text}}</pane>
 * </tabs>
 * ```
 *
 * The preferred solution is to query for `Pane` directives using this decorator.
 *
 * ```javascript
 * @Component({
 *   selector: 'pane',
 *   properties: ['title']
 * })
 * @View(...)
 * class Pane {
 *   title:string;
 * }
 *
 * @Component({
 *   selector: 'tabs'
 * })
 * @View({
 *  template: `
 *    <ul>
 *      <li *ng-for="#pane of panes">{{pane.title}}</li>
 *    </ul>
 *    <content></content>
 *  `
 * })
 * class Tabs {
 *   panes: QueryList<Pane>;
 *   constructor(@Query(Pane) panes:QueryList<Pane>) {
  *    this.panes = panes;
  *  }
 * }
 * ```
 *
 * A query can look for variable bindinds by passing in a string with desired binding symbol.
 *
 * ### Example ([live demo](http://plnkr.co/edit/sT2j25cH1dURAyBRCKx1?p=preview))
 * ```html
 * <seeker>
 *   <div #findme>...</div>
 * </seeker>
 *
 * @Component({
 *   selector: 'foo'
 * })
 * @View(...)
 * class seeker {
 *   constructor(@Query('findme') elList: QueryList<ElementRef>) {...}
 * }
 * ```
 *
 * In this case the object that is injected depend on the type of the variable
 * binding. It can be an ElementRef, a directive or a component.
 *
 * Passing in a comma separated list of variable bindings will query for all of them.
 *
 * ```html
 * <seeker>
 *   <div #find-me>...</div>
 *   <div #find-me-too>...</div>
 * </seeker>
 *
 *  @Component({
 *   selector: 'foo'
 * })
 * @View(...)
 * class Seeker {
 *   constructor(@Query('findMe, findMeToo') elList: QueryList<ElementRef>) {...}
 * }
 * ```
 *
 * Configure whether query looks for direct children or all descendants
 * of the querying element, by using the `descendants` parameter.
 * It is set to `false` by default.
 *
 * ### Example ([live demo](http://plnkr.co/edit/wtGeB977bv7qvA5FTYl9?p=preview))
 * ```html
 * <container #first>
 *   <item>a</item>
 *   <item>b</item>
 *   <container #second>
 *     <item>c</item>
 *   </container>
 * </container>
 * ```
 *
 * When querying for items, the first container will see only `a` and `b` by default,
 * but with `Query(TextDirective, {descendants: true})` it will see `c` too.
 *
 * The queried directives are kept in a depth-first pre-order with respect to their
 * positions in the DOM.
 *
 * Query does not look deep into any subcomponent views.
 *
 * Query is updated as part of the change-detection cycle. Since change detection
 * happens after construction of a directive, QueryList will always be empty when observed in the
 * constructor.
 *
 * The injected object is an unmodifiable live list.
 * See {@link QueryList} for more details.
 */
@CONST()
export class QueryMetadata extends DependencyMetadata {
  /**
   * whether we want to query only direct children (false) or all
   * children (true).
   */
  descendants: boolean;

  constructor(private _selector: Type | string,
              {descendants = false}: {descendants?: boolean} = {}) {
    super();
    this.descendants = descendants;
  }

  /**
   * always `false` to differentiate it with {@link ViewQueryMetadata}.
   */
  get isViewQuery(): boolean { return false; }

  /**
   * what this is querying for.
   */
  get selector() { return resolveForwardRef(this._selector); }

  /**
   * whether this is querying for a variable binding or a directive.
   */
  get isVarBindingQuery(): boolean { return isString(this.selector); }

  /**
   * returns a list of variable bindings this is querying for.
   * Only applicable if this is a variable bindings query.
   */
  get varBindings(): string[] { return StringWrapper.split(this.selector, new RegExp(",")); }

  toString(): string { return `@Query(${stringify(this.selector)})`; }
}

/**
 * Similar to {@link QueryMetadata}, but querying the component view, instead of
 * the content children.
 *
 * ### Example ([live demo](http://plnkr.co/edit/eNsFHDf7YjyM6IzKxM1j?p=preview))
 *
 * ```javascript
 * @Component({...})
 * @View({
 *   template: `
 *     <item> a </item>
 *     <item> b </item>
 *     <item> c </item>
 *   `
 * })
 * class MyComponent {
 *   shown: boolean;
 *
 *   constructor(private @Query(Item) items:QueryList<Item>) {
 *     items.onChange(() => console.log(items.length));
 *   }
 * }
 * ```
 *
 * Supports the same querying parameters as {@link QueryMetadata}, except
 * `descendants`. This always queries the whole view.
 *
 * As `shown` is flipped between true and false, items will contain zero of one
 * items.
 *
 * Specifies that a {@link QueryList} should be injected.
 *
 * The injected object is an iterable and observable live list.
 * See {@link QueryList} for more details.
 */
@CONST()
export class ViewQueryMetadata extends QueryMetadata {
  constructor(_selector: Type | string, {descendants = false}: {descendants?: boolean} = {}) {
    super(_selector, {descendants: descendants});
  }

  /**
   * always `true` to differentiate it with {@link QueryMetadata}.
   */
  get isViewQuery() { return true; }
  toString(): string { return `@ViewQuery(${stringify(this.selector)})`; }
}
