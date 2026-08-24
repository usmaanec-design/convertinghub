import { tool as audioMergeAudio } from './merge-audio/meta';
import { tool as audioTrim } from './trim/meta';
import { tool as audioChangeSpeed } from './change-speed/meta';
import { tool as audioExtractAudio } from './extract-audio/meta';
import { tool as audioLoopAudio } from './loop-audio/meta';
import { tool as audioConverter } from '../converters/audio-converter/meta';

export const audioTools = [
  audioConverter,
  audioExtractAudio,
  audioChangeSpeed,
  audioTrim,
  audioMergeAudio,
  audioLoopAudio
];
