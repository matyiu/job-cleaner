# Development Guidelines

## File Organization

### One Class Per File
Each class must be in its own file. The filename should match the class name in CamelCase.

Example:
- `JobMother` → `JobMother.ts`
- `ConfigMother` → `ConfigMother.ts`
- `Job` → `Job.ts`

This ensures:
- Better code navigation
- Easier imports
- Clearer project structure
- Simplified refactoring

### No Index Files
The usage of `index.ts` files is explicitly prohibited for any folder. Always import directly from the specific file.
