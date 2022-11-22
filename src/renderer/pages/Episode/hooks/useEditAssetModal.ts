import { IAsset } from '@recative/definitions';

import { ModalManager } from 'utils/hooks/useModalManager';

export const useEditAssetModal = ModalManager<IAsset, null>(null);
