import { AtlasResourceProcessor } from './AtlasResourceProcessor';
import { TextureAnalysisProcessor } from './TextureAnalysisProcessor';

export default {
  resourceProcessor: [TextureAnalysisProcessor, AtlasResourceProcessor],
};
