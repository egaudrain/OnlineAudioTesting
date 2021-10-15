# jspsych-audio-keyboard-response-wait

This plugin is similar to [jspsych-audio-keyboard-response](https://www.jspsych.org/plugins/jspsych-audio-keyboard-response/), but allows more control on when the trial stops.

This plugin plays audio files and records responses generated with the keyboard.

If the browser supports it, audio files are played using the WebAudio API. This allows for reasonably precise timing of the playback. The timing of responses generated is measured against the WebAudio specific clock, improving the measurement of response times. If the browser does not support the WebAudio API, then the audio file is played with HTML5 audio.

Audio files are automatically preloaded by jsPsych. However, if you are using timeline variables or another dynamic method to specify the audio stimulus you will need to [manually preload](https://www.jspsych.org/overview/media-preloading/#manual-preloading) the audio.

The trial can end when the subject responds, when the audio file has finished playing, or if the subject has failed to respond within a fixed length of time. In addition, the trial can end after the subject has responded *and* the audio file has finished playing if you want to make sure the subject always hears the stimulus completely. Once the subject pressed a key, following key presses are not registered anymore. It is possible to dim the interface to signify this to the participant.

## Parameters

Parameters with a default value of *undefined* must be specified. Other parameters can be left unspecified if the default value is acceptable.

Parameter       | Type              | Default Value | Description
----------------|-------------------|---------------|------------
stimulus        | string (audio)    | undefined     | The audio to be played.
choices         | array of keycodes | ALL_KEYS      | The keys the subject is allowed to press to respond to the stimulus.
prompt          | string            | null          | This string can contain HTML markup. The intention is that it can be used to provide a reminder about the action the subject is supposed to take.
trial_duration  | numeric          | null          | How long to wait for the subject to make a response before ending the trial, in milliseconds. If the subject fails to make a response before this timer is reached, the subject's response will be recorded as null for the trial and the trial will end. If the value of this parameter is null, the trial will wait for a response indefinitely.
response_ends_trial | boolean      | true          | If true, then the trial will end whenever the subject makes a response (assuming they make their response before the cutoff specified by the `trial_duration` parameter). If false, then the trial will continue until another condition ends the trial (either `trial_duration` or `trials_ends_after_audio`, but see `wait_for_audio`).
trial_ends_after_audio | boolean   | false         | If true, then the trial will end as soon as the audio file finishes playing.
wait_for_audio  | boolean          | false         | If `response_ends_trial` is true, this will still wait for the audio to end before ending the trial.
dim_content_after_response | boolean | false       | Will dim the content once the response has been given (a key has been pressed).
## Data Generated

In addition to the [default data collected by all plugins](overview#data-collected-by-plugins), this plugin collects the following data for each trial.

Name | Type | Value
-----|------|------
key_press | numeric | Indicates which key the subject pressed. The value is the [numeric key code](http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes) corresponding to the subject's response.
rt | numeric | The response time in milliseconds for the subject to make a response. The time is measured from when the stimulus first appears on the screen until the subject's response.
stimulus | string | Path to the audio file that played during the trial.

## Example

#### Plays a sound, and keeps playing until the end of the sound even if a response was given

```javascript
var trial = {
	type: 'audio-keyboard-response-wait',
	stimulus: 'sound/tone.mp3',
	choices: ['e', 'i'],
	prompt: "<p>Is the pitch high or low? Press 'e' for low and 'i' for high.</p>",
	response_ends_trial: true.
	wait_for_audio: true
};
```
