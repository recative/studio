import { AudioBackendScriptlet } from './AudioBackendScriptlet';
import { PhonographAudioBackend } from './PhonographAudioBackend';

export default {
  scriptlet: [AudioBackendScriptlet],
  resourceProcessor: [PhonographAudioBackend],
};
