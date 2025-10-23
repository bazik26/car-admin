import {
  DestroyRef,
  Injector,
  assertInInjectionContext,
  effect,
  inject,
  untracked
} from "./chunk-L7TZZFVV.js";
import {
  Observable,
  ReplaySubject,
  takeUntil
} from "./chunk-MARUHEWW.js";

// node_modules/@angular/core/fesm2022/rxjs-interop.mjs
function takeUntilDestroyed(destroyRef) {
  if (!destroyRef) {
    ngDevMode && assertInInjectionContext(takeUntilDestroyed);
    destroyRef = inject(DestroyRef);
  }
  const destroyed$ = new Observable((subscriber) => {
    if (destroyRef.destroyed) {
      subscriber.next();
      return;
    }
    const unregisterFn = destroyRef.onDestroy(subscriber.next.bind(subscriber));
    return unregisterFn;
  });
  return (source) => {
    return source.pipe(takeUntil(destroyed$));
  };
}
function toObservable(source, options) {
  if (ngDevMode && !options?.injector) {
    assertInInjectionContext(toObservable);
  }
  const injector = options?.injector ?? inject(Injector);
  const subject = new ReplaySubject(1);
  const watcher = effect(() => {
    let value;
    try {
      value = source();
    } catch (err) {
      untracked(() => subject.error(err));
      return;
    }
    untracked(() => subject.next(value));
  }, { injector, manualCleanup: true });
  injector.get(DestroyRef).onDestroy(() => {
    watcher.destroy();
    subject.complete();
  });
  return subject.asObservable();
}

export {
  takeUntilDestroyed,
  toObservable
};
/*! Bundled license information:

@angular/core/fesm2022/rxjs-interop.mjs:
  (**
   * @license Angular v20.3.7
   * (c) 2010-2025 Google LLC. https://angular.dev/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-IPPHBVHT.js.map
