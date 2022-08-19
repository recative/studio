import { AudioProcessor } from './AudioProcessor';
import { VideoSplitProcessor } from './VideoSplitProcessor';
import { AudioCompatibilityProcessor } from './AudioCompatibilityProcessor';

export default {
  resourceProcessor: [
    VideoSplitProcessor,
    AudioProcessor,
    AudioCompatibilityProcessor,
  ],
};
