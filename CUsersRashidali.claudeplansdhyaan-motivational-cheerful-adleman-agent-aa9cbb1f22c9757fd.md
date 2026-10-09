# Implementation Plan: Daily Progress Animations

This plan details the addition of a daily progress summary and enhanced completion animations for the Today screen in Dhyaan.

## 1. Analysis of Minimal Data-Model Impact
- **Field Verification**: The `Task` type already contains `doneAt: number | null`.
- **Migration**: No database or `localStorage` migration is required. 
- **Legacy Handling**: Tasks created before `doneAt` existed (where `doneAt` is `null`) are correctly ignored in completion counts (see `src/streaks.ts`), which is the desired behavior as their completion date is unknown.
- **Consistency**: Using `doneAt` ensures the progress bar is based on actual completion timestamps rather than just the `done` boolean.

## 2. Logic Implementation

### Progress Calculation
I will implement a new selector `selectDailyProgress` in `src/selectors.ts`.

**Rules:**
- **Numerator (C)**: Count of tasks where `done === true` AND `dayKeyFromTimestamp(doneAt) === today`.
- **Denominator (T)**: `C` + count of tasks where `done === false` AND (`dueDate === today` OR (`dueDate !== null` AND `dueDate < today`)).
- **Result**: An object `{ completed: C, total: T, percentage: T > 0 ? Math.round((C / T) * 100) : 0 }`.

**Implementation Detail:**
- Use `todayLocal()` to get the current date string.
- Pure function for easy testing.

## 3. UI Implementation

### Today Screen (App.tsx)
- **Placement**: Insert the `DailyProgress` component between `<h2>Today</h2>` and the first task list (Overdue section).
- **Component Structure**:
  ```tsx
  <div className="daily-progress">
    <div className="daily-progress-text">
      {completed} of {total} tasks completed {total > 0 && `· ${percentage}%`}
    </div>
    {total > 0 && (
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    )}
  </div>
  ```

### Styling (styles.css)
- **Colors**: Use `--color-accent` for the bar fill and `--color-border-subtle` for the background.
- **Animation**: Use `cubic-bezier(0.16, 1, 0.3, 1)` for the progress bar width transition.
- **Layout**: Compact vertical spacing, aligned with the Today heading.

## 4. Animation Strategy

### Task Completion Animation
- **Checkbox**: The existing `check-fill` animation provides a pop. I will ensure the `transition: background var(--transition-fast)` is smooth.
- **Row Highlight**: 
  - Add a CSS keyframe `row-flash` that briefly changes the `background-color` to a soft accent color (e.g., `var(--color-accent-soft)`) and fades back to `var(--color-surface-elevated)`.
  - Apply this class to the `TaskRow` momentarily upon completion.
- **Reduced Motion**: Respect `prefers-reduced-motion` by disabling the `row-flash` and reducing the `progress-bar-fill` transition time.

## 5. Testing Strategy

### Test Cases for `selectDailyProgress`
1. **Empty State**: No tasks $\rightarrow$ $C=0, T=0$. Output: "0 tasks completed", no bar.
2. **All Completed Today**: 3 tasks completed today $\rightarrow$ $C=3, T=3$ (100%).
3. **Mixed Today**: 2 completed today, 2 due today/overdue $\rightarrow$ $C=2, T=4$ (50%).
4. **Overdue Only**: 2 overdue, 0 completed $\rightarrow$ $C=0, T=2$ (0%).
5. **Future Tasks**: 1 task due tomorrow $\rightarrow$ $T$ should ignore it.
6. **Inbox Tasks**: 1 unfinished task with no due date $\rightarrow$ $T$ should ignore it.
7. **Old Completions**: Task completed yesterday $\rightarrow$ $C$ should ignore it.
8. **Legacy Tasks**: Task with `done: true` but `doneAt: null` $\rightarrow$ $C$ should ignore it.

## 6. Step-by-Step Execution Guide

### Milestone 1: Logic & Testing
- [ ] Implement `selectDailyProgress` in `src/selectors.ts`.
- [ ] Create `src/selectors.test.ts` (if not existing) or add test cases to cover all 8 scenarios above.

### Milestone 2: Progress UI
- [ ] Add CSS for `.daily-progress`, `.progress-bar-container`, and `.progress-bar-fill` in `src/styles.css`.
- [ ] Integrate the progress summary into `App.tsx` in the Today tab.
- [ ] Verify responsiveness and theme compatibility.

### Milestone 3: Completion Animations
- [ ] Define `@keyframes row-flash` in `src/styles.css`.
- [ ] Modify `TaskRow` or `App.tsx`'s `handleToggle` to trigger the flash animation.
- [ ] Verify `prefers-reduced-motion` behavior.

### Milestone 4: Final Polish
- [ ] Review all animations for consistency with `cubic-bezier(0.16, 1, 0.3, 1)`.
- [ ] Final end-to-end check of the "Today" flow.
