# jspsych-audio-sequence-button-response

This plugin plays a sequence of audio files, highlighting answer buttons as they are played.

This plugin is based on [jspsych-audio-button-response](https://www.jspsych.org/plugins/jspsych-audio-button-response/).

Audio files are automatically preloaded by jsPsych. However, if you are using timeline variables or another dynamic method to specify the audio stimulus you will need to manually preload the audio.

The trial can end when the subject responds, when the audio file has finished playing, or if the subject has failed to respond within a fixed length of time.

Note that the buttons are disabled during playing so the subject cannot press any button during that time.

## Parameters

Parameters with a default value of *undefined* must be specified. Other parameters can be left unspecified if the default value is acceptable.

Parameter       | Type             | Default Value | Description
----------------|------------------|---------------|------------
stimuli         | array of strings | undefined     | An array listing the path (url) to the audio files to be played.
choices         | array of strings | []            | Labels for the buttons. Each different string in the array will generate a different button. It is not absolutely mandatory, but it is probably a good idea to have this being the same length as `stimuli`.
button_html     | HTML string      | `'<button class="jspsych-btn">%choice%</button>'` | A template of HTML for generating the button elements. You can override this to create customized buttons of various kinds. The string `%choice%` will be changed to the corresponding element of the `choices` array. You may also specify an array of strings, if you need different HTML to render for each button. If you do specify an array, the `choices` array and this array must have the same length. The HTML from position 0 in the `button_html` array will be used to create the button for element 0 in the `choices` array, and so on.
prompt          | string           | null          | This string can contain HTML markup. Any content here will be displayed below or above the stimulus (see `prompt_position`). The intention is that it can be used to provide a reminder about the action the subject is supposed to take.
prompt_position | string           | `'bottom'`    | The position of the prompt: `'bottom'` or `'above'`.
isi             | numeric          | 0             | Inter-stimulus-interval: The delay in between stimulus presentation (in ms).
trial_duration  | numeric          | null          | How long to wait for the subject to make a response before ending the trial in milliseconds. If the subject fails to make a response before this timer is reached, the subject's response will be recorded as null for the trial and the trial will end. If the value of this parameter is null, the trial will wait for a response indefinitely.
margin_vertical | string           | `'0px'`       | Vertical margin of the button(s).
margin_horizontal | string         | `'8px'`       | Horizontal margin of the button(s).
response_ends_trial | boolean      | true          | If true, then the trial will end whenever the subject makes a response (assuming they make their response before the cutoff specified by the `trial_duration` parameter). If false, then the trial will continue until the value for `timing_response` is reached. You can use this parameter to force the subject to view a stimulus for a fixed amount of time, even if they respond before the time is complete.
trial_ends_after_audio | boolean   | false         | If true, then the trial will end as soon as the audio file finishes playing.
visual_feedback | boolean          | false         | If true, provides feedback after the subject gave their answer. If this is set to true, `i_correct` has to be also specified.
i_correct       | numeric          | null          | The index of the choice that corresponds to the correct answer (for feedback, otherwise it is optional).

## Data Generated

In addition to the [default data collected by all plugins](overview#datacollectedbyplugins), this plugin collects the following data for each trial.

Name | Type | Value
-----|------|------
rt | numeric | The response time in milliseconds for the subject to make a response. The time is measured from when the stimulus first appears on the screen until the subject's response.
stimuli | array of strings | The list of stimuli that was passed as parameter (just for convenience).
button_pressed | numeric | Indicates which button the subject pressed. The first button in the `choices` array is 0, the second is 1, and so on.

## Styling elements

### IDs

id                                         | Description
-------------------------------------------|------------------------------------
`jspsych-audio-sequence-button-response-#` | Where `#` is the index of the choice. This is the div that is wrapping each response button (not the button itself).


### CSS Classes

Class                                      | Description
-------------------------------------------|------------------------------------
jspsych-audio-button-response-btngroup     | The `<div>` wrapping the button group.
jspsych-audio-sequence-button-response     | This class is applied to the `<div>`s wrapping the buttons.
jspsych-prompt                             | The `<p>` that contains the prompt.
highlighted                                | The button inside the `<div>`s receive this class when the button is highlighted.
disabled                                   | When the buttons are disabled. This is a class, for convenience, although attribute selector should also work `[disabled]`.
visual-feedback                            | This class is given to the button that represents the correct option, *after* the subject has given their answer.
correct, incorrect                         | One of these classes is given to the button that represents the correct option, depending on whether the subject's answer was correct or incorrect.

## Dependencies

This plugin relies on [jQuery](https://jquery.com/). Note that this is not absolutely necessary, but it makes some things fail silently instead of raising errors. If you need this plugin without jQuery, you can easily
replace the jQuery syntax with standard Javascript DOM manipulation.

The animation of the visual feedback can make use of [Semantic UI's transitions](https://semantic-ui.com/modules/transition.html). But if that's not available a simpler blink animation is implemented here.

## Example

#### Three alternative forced choice (3AFC)

```javascript
var trial = {
	type: 'audio-button-response',
	stimuli: ['sound/bi.mp3', 'sound/ba.mp3', 'sound/bi.mp3'],
	choices: ['1', '2', '3'],
	prompt: "<p>Which one is different from the two others?</p>"
};
```
