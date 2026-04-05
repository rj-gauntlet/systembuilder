import type { LevelDefinition } from '../engine/types';
import { urlShortener } from './beginner/url-shortener';
import { pasteBin } from './beginner/paste-bin';
import { chatApp } from './beginner/chat-app';

export const allLevels: LevelDefinition[] = [
  urlShortener,
  pasteBin,
  chatApp,
];
