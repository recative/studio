export const getSelectedId = () => {
  const selectedResources = document.querySelectorAll(
    '.explorer-item.resource-selected'
  );

  return Array.from(selectedResources)
    .map((selectedItem) => (selectedItem as HTMLDivElement)?.dataset.resourceId)
    .filter((x) => !!x) as string[];
};
