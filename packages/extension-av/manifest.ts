import { VideoProcessor } from './VideoProcessor';
import { AudioProcessor } from './AudioProcessor';
import { VideoSplitProcessor } from './VideoSplitProcessor';
import { RawFileRemovalProcessor } from './RawFileRemovalProcessor';
import { AudioCompatibilityProcessor } from './AudioCompatibilityProcessor';

export default {
  resourceProcessor: [
    VideoSplitProcessor,
    AudioProcessor,
    VideoProcessor,
    AudioCompatibilityProcessor,
    RawFileRemovalProcessor,
  ],
};
