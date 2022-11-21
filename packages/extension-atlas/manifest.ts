import { AtlasResourceProcessor } from './AtlasResourceProcessor';
import { AtlasResourceScriptlet } from './AtlasResourceScriptlet';
import { TextureAnalysisProcessor } from './TextureAnalysisProcessor';

export default {
  scriptlet: [AtlasResourceScriptlet],
  resourceProcessor: [TextureAnalysisProcessor, AtlasResourceProcessor],
};
