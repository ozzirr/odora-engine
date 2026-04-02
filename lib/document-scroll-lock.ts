"use client";

type ElementLockState = {
  overflowLocks: number;
  overscrollLocks: number;
  initialOverflow: string | null;
  initialOverscrollBehavior: string | null;
};

type DocumentScrollLockOptions = {
  lockBody?: boolean;
  lockRoot?: boolean;
  disableOverscroll?: boolean;
};

const elementLockStates = new WeakMap<HTMLElement, ElementLockState>();

function getOrCreateElementLockState(element: HTMLElement) {
  const existingState = elementLockStates.get(element);

  if (existingState) {
    return existingState;
  }

  const nextState: ElementLockState = {
    overflowLocks: 0,
    overscrollLocks: 0,
    initialOverflow: null,
    initialOverscrollBehavior: null,
  };

  elementLockStates.set(element, nextState);
  return nextState;
}

function clearElementLockStateIfUnused(element: HTMLElement, state: ElementLockState) {
  if (state.overflowLocks === 0 && state.overscrollLocks === 0) {
    elementLockStates.delete(element);
  }
}

function lockElementOverflow(element: HTMLElement) {
  const state = getOrCreateElementLockState(element);

  if (state.overflowLocks === 0) {
    state.initialOverflow = element.style.overflow;
    element.style.overflow = "hidden";
  }

  state.overflowLocks += 1;

  return () => {
    const currentState = elementLockStates.get(element);

    if (!currentState || currentState.overflowLocks === 0) {
      return;
    }

    currentState.overflowLocks -= 1;

    if (currentState.overflowLocks === 0) {
      element.style.overflow = currentState.initialOverflow ?? "";
      currentState.initialOverflow = null;
    }

    clearElementLockStateIfUnused(element, currentState);
  };
}

function lockElementOverscroll(element: HTMLElement) {
  const state = getOrCreateElementLockState(element);

  if (state.overscrollLocks === 0) {
    state.initialOverscrollBehavior = element.style.overscrollBehavior;
    element.style.overscrollBehavior = "none";
  }

  state.overscrollLocks += 1;

  return () => {
    const currentState = elementLockStates.get(element);

    if (!currentState || currentState.overscrollLocks === 0) {
      return;
    }

    currentState.overscrollLocks -= 1;

    if (currentState.overscrollLocks === 0) {
      element.style.overscrollBehavior = currentState.initialOverscrollBehavior ?? "";
      currentState.initialOverscrollBehavior = null;
    }

    clearElementLockStateIfUnused(element, currentState);
  };
}

function lockElementScroll(
  element: HTMLElement,
  { disableOverscroll = false }: { disableOverscroll?: boolean } = {},
) {
  const releaseOverflow = lockElementOverflow(element);
  const releaseOverscroll = disableOverscroll ? lockElementOverscroll(element) : null;
  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;
    releaseOverscroll?.();
    releaseOverflow();
  };
}

export function lockDocumentScroll({
  lockBody = true,
  lockRoot = false,
  disableOverscroll = false,
}: DocumentScrollLockOptions = {}) {
  if (typeof document === "undefined") {
    return () => {};
  }

  const releases: Array<() => void> = [];

  if (lockRoot) {
    releases.push(lockElementScroll(document.documentElement, { disableOverscroll }));
  }

  if (lockBody) {
    releases.push(lockElementScroll(document.body, { disableOverscroll }));
  }

  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;

    for (const release of releases.reverse()) {
      release();
    }
  };
}
