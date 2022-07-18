export enum ReleaseType {
  Code,
  Media,
  Bundle,
  Player,
}

export const BUNDLE_TYPE_MAP = {
  code: ReleaseType.Code,
  media: ReleaseType.Media,
  bundle: ReleaseType.Bundle,
};
