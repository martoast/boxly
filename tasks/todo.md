# Add Gender CRUD + filter to the Shop

## Goal

Add a new top-level taxonomy — **Gender** — that sits alongside Categories and Stores. Each Product can optionally belong to one Gender (nullable FK; gender-neutral products stay blank). Admins and Velonie's shopping team can manage genders. Customers see Gender as a filter in the shop's filter drawer + active-chip bar, just like the existing Category and Store filters.

## Pattern we're mirroring

**Gender ≈ Store**, not Category — Store uses a single direct FK on `products.store_id`, Category uses a many-to-many pivot. Gender is one-per-product, so we copy the Store wiring (FK pattern), but the form/UI/CRUD is closer to Category (single image, no cover image, no `show_on_landing`).

## Backend (api/) — files to create

### 1. Migration `2026_05_07_000000_create_genders_and_add_to_products.php`
- `genders` table mirrors `categories`: `id`, `name`, `slug` (unique), `description` (text, nullable), `image_url` (string, nullable), `is_active` (bool, default true), `sort_order` (uint, default 0), `timestamps`, `index('is_active')`.
- Add nullable FK to products: `$table->foreignId('gender_id')->nullable()->after('store_id')->constrained('genders')->nullOnDelete(); $table->index('gender_id');`

### 2. Model `app/Models/Gender.php`
- Fillable: `name`, `slug`, `description`, `image_url`, `is_active`, `sort_order`
- Casts: `is_active=>boolean`, `sort_order=>integer`
- `scopeActive`, `generateUniqueSlug` (copied from Category)
- `products()` → HasMany (matches Store, since one-product-many-genders is wrong)

### 3. Update `app/Models/Product.php`
- Add `gender_id` to `$fillable`
- Add `gender()` → BelongsTo Gender

### 4. Controller `app/Http/Controllers/Admin/AdminGenderController.php`
- index/show/store/update/destroy/uploadImage — copy `AdminCategoryController` verbatim, swap `Category`→`Gender`, `categories`→`genders`. Image path: `genders/{slug}/img-{ts}.{ext}`.

### 5. Update `app/Http/Controllers/StoreProductController.php`
- Add `gender_id` + `gender_slug` to `index()` validation and filter blocks (mirror category lines 51-63 but using direct `where('gender_id', ...)` instead of `whereHas`).
- Add public `genders()` action that returns active genders for the shop filter.
- Eager-load `gender` on product show + index responses.

### 6. Update `app/Http/Controllers/Admin/AdminProductController.php`
- `index()`: add `gender_id` to validation + filter (`where('gender_id', ...)`)
- `store()`/`update()`: add `'gender_id' => 'nullable|integer|exists:genders,id'` and let it flow through `$validated` (no `unset` needed — it's a real product column).
- Eager-load `gender` in responses.

### 7. Routes `routes/api.php`
- Public: add `Route::get('/genders', [StoreProductController::class, 'genders']);` to the `store` group.
- Admin: add the 6 genders routes inside the `admin` middleware group (mirror the `categories` block exactly).
- Shopping: same 6 routes inside the `shopping` middleware group.

## Frontend (app/) — files to create + edit

### 8. Form component `components/admin/AdminGenderForm.vue` (NEW)
Copy `AdminCategoryForm.vue` line-for-line (name/slug/image/description/is_active/sort_order, image upload preview, `apiNs` computed for admin-vs-shopping route detection). No deltas other than the entity name.

### 9. Six page files (NEW, all thin wrappers around AdminGenderForm)
- `pages/app/admin/genders/index.vue`, `create.vue`, `[id]/edit.vue`
- `pages/app/shopping/genders/index.vue`, `create.vue`, `[id]/edit.vue`

Copy from the equivalent Category pages.

### 10. Sidebar nav links (EDIT)
- `components/AdminSidebar.vue`: add `storeGenders` translation + nav item right after `storeCategories` (~line 290-300 area).
- `components/ShoppingSidebar.vue`: same.
- Icon: `UserGroupIcon` from `@heroicons/vue/24/outline` (semantically right for gender; not gender-emoji-loaded).

### 11. Product form (EDIT) `components/admin/AdminProductForm.vue`
- Add a `gender_id` single-select dropdown right under the existing `store_id` select. "— Sin género —" as the null option.
- Add `genders` ref, fetch on mount via `${apiNs}/genders` (or `/store/genders` — admin endpoint preferred for parity with stores).
- Add `gender_id: null` to the form's initial state.

### 12. Public shop filter (EDIT) `pages/shop/index.vue`
Mirror exactly what's wired for `selectedStore` (since gender is a single-FK filter, same shape). Touchpoints:
- `t` translations: `genderLabel`
- `genders` ref + `loadGenders()` lazy-loader
- `selectedGender` ref synced from `route.query.gender_id`
- `selectedGenderObj` computed
- `setGender(id)` method
- `fetchProducts` query: add `gender_id`
- `hasFilter` boolean: include `selectedGender`
- `router.replace` query: include `gender_id`
- `clearAllFilters`: reset `selectedGender`
- Active-chip bar: chip for `selectedGenderObj`
- Filters drawer: new `<details>` block — list of gender pills below the existing category/store sections
- `watch(() => route.query, ...)` re-sync block: include `gender_id`

### 13. Public product detail page (NO CHANGE — for now)
Don't surface gender in breadcrumbs. It's filter metadata, not a navigational hierarchy. Easy to add later.

### 14. CLI (EDIT)
- `cli/commands/genders.js` (NEW) — copy `cli/commands/categories.js` verbatim, swap entity name. Endpoints: `/admin/genders/...`.
- `cli/boxly.js` — add `import { registerGenders } from './commands/genders.js'` and `registerGenders(program)`.

## Optional question: do you want a *more prominent* gender entry point?

The plan above puts Gender inside the filter drawer at the same prominence as Store/Category — three peer sections, three peer chips. That's the cleanest "main filter that is separate from categories and stores" interpretation.

If you want gender to be **more prominent** (e.g. a top-of-catalog "Hombre / Mujer / Ver todo" pill bar above the product grid, since it's a coarser cut than category), I can add that as a fourth touchpoint in `pages/shop/index.vue`. Tell me and I'll fold it in.

## Order of work (dependencies)

1. Backend migration + model + product FK (must run on prod before frontend can call new endpoints)
2. Backend controllers + routes
3. Admin frontend (gender CRUD pages + sidebar links + product form gender field)
4. Public shop filter wiring
5. CLI commands
6. End-to-end test: create "Hombre" + "Mujer" via admin → assign one to a product → confirm public catalog filter works

Each layer is isolated enough to commit separately if you want incremental review, but I'll plan to commit as one feature unless you ask otherwise.

## Files touched (count)

- Backend: 1 migration + 1 model + 1 controller (NEW) + 3 controllers edited + 1 routes file edited = 7 files
- Frontend: 1 form component + 6 page files (NEW) + 4 components edited + 1 page edited = 12 files
- CLI: 1 command (NEW) + 1 entrypoint edited = 2 files

Total: ~21 files. Big, but mechanical — everything maps one-to-one onto the existing Category/Store structure.

## Open questions before I start

1. **Gender prominence** — peer-with-Category-and-Store in the filter drawer (current plan), or also a top-of-catalog pill bar above the grid?
2. **Initial gender values** — should the migration seed "Hombre" and "Mujer" by default, or leave the table empty for you to create them via admin UI on first deploy?
3. **Gender on product cards** — show a small "Hombre/Mujer" tag on the card itself, or keep cards as-is and let gender live only in filters?
4. **Image upload field** — keep it (mirrors Category) for future flexibility, or strip it from the form since gender icons aren't really a thing? I'd default to keeping it; trivial to remove later.
5. **Bundle into one PR or split** (backend + frontend + CLI as separate commits)?

## Tasks (will create after approval)

1. Backend migration + model
2. Backend AdminGenderController
3. Backend StoreProductController + AdminProductController updates
4. Backend routes
5. Frontend AdminGenderForm component
6. Frontend admin/shopping gender pages (6)
7. Frontend sidebar nav links (admin + shopping)
8. Frontend AdminProductForm gender field
9. Frontend public shop filter wiring
10. CLI gender command
11. End-to-end smoke test

## Review

(filled in after implementation)
