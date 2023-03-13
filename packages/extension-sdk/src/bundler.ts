export interface IBundleProfile {
  id: string;
  packageId: string;
  prefix: string;
  label: string;
  metadataFormat: string;
  bundleExtensionId: string;
  constantFileName: string;
  offlineAvailability: string;
  excludedResourceTags: string[];
  shellTemplateFileName: string;
  webRootTemplateFileName: string;
  extensionConfigurations: Record<string, string>;
}
