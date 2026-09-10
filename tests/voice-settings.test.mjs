import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultVoiceSettings, parseVoiceSettings, voicePreferences, voiceSessionSettings, VOICE_MODEL } from '../features/atlas/voice-settings.ts';
test('corrupt or out-of-range saved settings fall back safely', () => {
  for (const value of [null, {voice:'invalid'}, {silence:0}, {threshold:1.5}]) assert.deepEqual(parseVoiceSettings(value), defaultVoiceSettings);
});
test('older settings receive defaults and typed spaces are preserved', () => {
  const settings = parseVoiceSettings({voice:'cedar',custom:'Use concrete '});
  assert.equal(settings.voice,'cedar'); assert.equal(settings.custom,'Use concrete '); assert.equal(settings.length,'Balanced');
});
test('hold-to-talk disables detection; semantic detection excludes silence settings', () => {
  assert.equal(voiceSessionSettings(defaultVoiceSettings,false).turnDetection,null);
  assert.deepEqual(voiceSessionSettings({...defaultVoiceSettings,detection:'semantic-vad'},true).turnDetection,{type:'semantic-vad'});
});
test('listening and transcription preferences reach session configuration', () => {
  const config=voiceSessionSettings({...defaultVoiceSettings,voice:'cedar',silence:1200,threshold:.7,prefix:500,transcriptionLanguage:'es',vocabulary:'Minerva'},true);
  assert.equal(config.voice,'cedar'); assert.equal(config.turnDetection.silenceDurationMs,1200); assert.equal(config.turnDetection.threshold,.7); assert.equal(config.turnDetection.prefixPaddingMs,500);
  assert.deepEqual(config.inputAudioTranscription,{language:'es',prompt:'Minerva'});
  assert.equal(VOICE_MODEL,'openai/gpt-realtime-2.1');
});
test('style preferences do not reintroduce a topic or rigid brief answer', () => {
  const prompt=voicePreferences({...defaultVoiceSettings,length:'Detailed',custom:'Challenge assumptions',pace:'Slow'});
  assert.match(prompt,/thorough/); assert.match(prompt,/Challenge assumptions/); assert.match(prompt,/Slow/); assert.doesNotMatch(prompt,/shopping mall|one or two sentences/);
});
