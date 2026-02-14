# Font Selector Dropdowns - Component Creation & Responsive Layout Plan

## Overview

Create reusable components for the subset and variant dropdowns, and make the font control containers responsive so they wrap on small screens instead of going off-screen.

## Current State Analysis

### Location

- File: `src/routes/book/[id]/highlight/[hid]/+page.svelte`
- Lines: 629-696 (Main font controls), 758-830 (Sub font controls)

### Current Structure

For each font (main and sub), there are three controls:

1. **FontSelector** (Sheet component) - Opens a bottom sheet to select a font
2. **Subset Dropdown** (DropdownMenu) - Selects font subset (e.g., latin, cyrillic)
3. **Variant Dropdown** (DropdownMenu) - Selects font variant (e.g., regular, 700)

### Current Layout Issue

```html
<div class="mb-2 flex gap-2">
  <FontSelector ... />
  <DropdownMenu.Root> <!-- Subset -->
  <DropdownMenu.Root> <!-- Variant -->
</div>
```

- Uses `flex` without `flex-wrap`
- On small screens, dropdowns extend beyond viewport width
- No responsive behavior

## Proposed Solution

### 1. Create New Components

#### Component 1: `subset-dropdown.svelte`

**Location:** `src/lib/components/subset-dropdown.svelte`

**Props:**

- `font: GoogleFont | null` - The selected font
- `selectedSubset: string` - Currently selected subset (bindable)
- `onValueChange: (value: string) => void` - Callback when subset changes
- `disabled: boolean` - Whether dropdown is disabled

**Features:**

- Uses DropdownMenu component
- Shows "Subset" placeholder when no font selected
- Disabled state when no font selected
- Minimum width of 100px
- Scrollable content (max-height 300px)

#### Component 2: `variant-dropdown.svelte`

**Location:** `src/lib/components/variant-dropdown.svelte`

**Props:**

- `font: GoogleFont | null` - The selected font
- `selectedVariant: string` - Currently selected variant (bindable)
- `onValueChange: (value: string) => void` - Callback when variant changes
- `disabled: boolean` - Whether dropdown is disabled

**Features:**

- Uses DropdownMenu component
- Shows "Variant" placeholder when no font selected
- Disabled state when no font selected
- Minimum width of 100px
- Scrollable content (max-height 300px)

### 2. Update Page Layout

#### Change 1: Add flex-wrap to font control containers

```html
<!-- Before -->
<div class="mb-2 flex gap-2">
	<!-- After -->
	<div class="mb-2 flex flex-wrap gap-2"></div>
</div>
```

#### Change 2: Import new components

```typescript
import SubsetDropdown from '$lib/components/subset-dropdown.svelte';
import VariantDropdown from '$lib/components/variant-dropdown.svelte';
```

#### Change 3: Replace inline dropdowns with components

```html
<!-- Main Font Controls -->
<div class="mb-2 flex flex-wrap gap-2">
	<FontSelector type="main" ... />
	<SubsetDropdown
		font="{mainFont}"
		bind:selectedSubset="{mainSubset}"
		onValueChange="{updateMainSubset}"
	/>
	<VariantDropdown
		font="{mainFont}"
		bind:selectedVariant="{mainVariant}"
		onValueChange="{updateMainVariant}"
	/>
</div>

<!-- Sub Font Controls -->
<div class="mb-2 flex flex-wrap gap-2 py-0">
	<FontSelector type="sub" ... />
	<SubsetDropdown
		font="{subFont}"
		bind:selectedSubset="{subSubset}"
		onValueChange="{updateSubSubset}"
	/>
	<VariantDropdown
		font="{subFont}"
		bind:selectedVariant="{subVariant}"
		onValueChange="{updateSubVariant}"
	/>
</div>
```

### 3. Responsive Behavior

With `flex-wrap`:

- On large screens: All three controls appear on one line
- On medium screens: Controls wrap to fit available width
- On small screens: Each control takes its own line

## Implementation Steps

1. **Create `subset-dropdown.svelte`**
   - Copy subset dropdown logic from page
   - Extract into reusable component
   - Add proper TypeScript types

2. **Create `variant-dropdown.svelte`**
   - Copy variant dropdown logic from page
   - Extract into reusable component
   - Add proper TypeScript types

3. **Update `+page.svelte`**
   - Import new components
   - Replace inline DropdownMenu code with new components
   - Add `flex-wrap` to font control containers

4. **Test responsive behavior**
   - Verify wrapping on different screen sizes
   - Ensure functionality remains intact

## Files to Create/Modify

### New Files

- `src/lib/components/subset-dropdown.svelte`
- `src/lib/components/variant-dropdown.svelte`

### Modified Files

- `src/routes/book/[id]/highlight/[hid]/+page.svelte`

## Component Interface Examples

### subset-dropdown.svelte

```svelte
<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown } from '@lucide/svelte';
	import type { GoogleFont } from '$lib/types';

	interface Props {
		font: GoogleFont | null;
		selectedSubset: string;
		onValueChange: (value: string) => void;
	}

	let { font, selectedSubset, onValueChange }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger disabled={!font}>
		<Button variant="outline" class="min-w-[100px] justify-between font-normal" disabled={!font}>
			<span class={font ? '' : 'text-muted-foreground'}>
				{font ? selectedSubset : 'Subset'}
			</span>
			<ChevronDown class="ml-2 h-4 w-4 text-muted-foreground" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="max-h-[300px] overflow-y-auto">
		<DropdownMenu.RadioGroup value={selectedSubset} {onValueChange}>
			{#if font}
				{#each font.subsets as subset}
					<DropdownMenu.RadioItem value={subset}>
						{subset}
					</DropdownMenu.RadioItem>
				{/each}
			{/if}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
```

### variant-dropdown.svelte

```svelte
<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown } from '@lucide/svelte';
	import type { GoogleFont } from '$lib/types';

	interface Props {
		font: GoogleFont | null;
		selectedVariant: string;
		onValueChange: (value: string) => void;
	}

	let { font, selectedVariant, onValueChange }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger disabled={!font}>
		<Button variant="outline" class="min-w-[100px] justify-between font-normal" disabled={!font}>
			<span class={font ? '' : 'text-muted-foreground'}>
				{font ? selectedVariant : 'Variant'}
			</span>
			<ChevronDown class="ml-2 h-4 w-4 text-muted-foreground" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="max-h-[300px] overflow-y-auto">
		<DropdownMenu.RadioGroup value={selectedVariant} {onValueChange}>
			{#if font}
				{#each font.variants as variant}
					<DropdownMenu.RadioItem value={variant}>
						{variant}
					</DropdownMenu.RadioItem>
				{/each}
			{/if}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
```
