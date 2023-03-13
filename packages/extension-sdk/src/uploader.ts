export interface IUploadProfile {
  id: string;
  label: string;
  uploaderExtensionId: string;
  extensionConfigurations: Record<string, string>;
}
