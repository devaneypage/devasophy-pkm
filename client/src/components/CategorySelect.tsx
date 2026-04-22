import React from "react";

type TaxonomyTreeNode = {
  id: number;
  areaNumber: number;
  areaName: string;
  categories: Array<{
    id: number;
    categoryNumber: string;
    categoryName: string;
  }>;
};

type CategorySelectProps = {
  value?: number;
  onChange: (value: number | undefined) => void;
  tree?: TaxonomyTreeNode[];
  label: string;
  placeholder?: string;
};

export default function CategorySelect({
  value,
  onChange,
  tree,
  label,
  placeholder = "Select a Johnny Decimal category",
}: CategorySelectProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
      <select
        value={value ?? ""}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue ? Number(nextValue) : undefined);
        }}
        className="h-11 w-full rounded-full border-2 border-black/85 bg-white px-4 text-sm font-medium text-foreground shadow-none outline-none transition focus:border-black"
      >
        <option value="">{placeholder}</option>
        {(tree || []).map((area) => (
          <optgroup key={area.id} label={`${area.areaNumber} · ${area.areaName}`}>
            {area.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.categoryNumber} · {category.categoryName}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
